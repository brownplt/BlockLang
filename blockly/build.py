#!/usr/bin/python
# Compresses the core Blockly files into a single JavaScript file.
#
# Copyright 2012 Google Inc.
# http://blockly.googlecode.com/
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#   http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

# This script generates two files:
#   blockly_compressed.js
#   blockly_uncompressed.js
# The compressed file is a concatenation of all of Blockly's core files which
# have been run through Google's Closure Compiler.  This is done using the
# online API (which takes a few seconds and requires an Internet connection).
# The uncompressed file is a script that loads in each of Blockly's core files
# one by one.  This takes much longer for a browser to load, but is useful
# when debugging code since line numbers are meaningful and variables haven't
# been renamed.  The uncompressed file also allows for a faster developement
# cycle since there is no need to rebuild or recompile, just reload.

import glob, os, re, sys, subprocess, fileinput

def needs_compile(target_filename, filenames):
  try:
    with open(target_filename): pass
    exists = True
  except IOError: 
    exists = False
  if exists:
    last_compiled = os.stat(target_filename).st_mtime
    last_changed = max([os.stat(f).st_mtime for f in filenames])
    if last_changed > last_compiled:
      print "%s needs to be re-compiled" % target_filename
      return True
    else: 
      print "Skipping %s (no dependencies have been updated since last compilation)" % target_filename
      return False
  else: 
    return True


def import_path(fullpath):
  """Import a file with full path specification.
  Allows one to import from any directory, something __import__ does not do.

  Args:
      fullpath:  Path and filename of import.

  Returns:
      An imported module.
  """
  path, filename = os.path.split(fullpath)
  filename, ext = os.path.splitext(filename)
  sys.path.append(path)
  module = __import__(filename)
  reload(module) # Might be out of date
  del sys.path[-1]
  return module


HEADER = ('// Do not edit this file; automatically generated by build.py.\n'
          '"use strict";\n')


class Gen_uncompressed():
  """Generate a JavaScript file that loads Blockly's raw files.
  """
  def __init__(self, search_paths):
    self.search_paths = search_paths

  def run(self):
    target_filename = 'blockly_uncompressed.js'
    filenames = calcdeps.CalculateDependencies(self.search_paths, ["core/blockly.js"])
    if not needs_compile(target_filename, filenames):
      return True

    f = open(target_filename, 'w')
    f.write(HEADER)
    f.write("""
window.BLOCKLY_DIR = (function() {
  // Find name of current directory.
  var scripts = document.getElementsByTagName('script');
  var re = new RegExp('(.+)[\/]blockly_uncompressed\.js$');
  for (var x = 0, script; script = scripts[x]; x++) {
    var match = re.exec(script.src);
    if (match) {
      return match[1];
    }
  }
  alert('Could not detect Blockly\\'s directory name.');
  return '';
})();

window.BLOCKLY_BOOT = function() {
// Execute after Closure has loaded.
if (!window.goog) {
  alert('Error: Closure not found.  Read this:\\n' +
        'http://code.google.com/p/blockly/wiki/Closure\\n');
}

// Build map of all dependencies (used and unused).
var dir = window.BLOCKLY_DIR.match(/[^\\/]+$/)[0];
""")
    add_dependency = []
    base_path = calcdeps.FindClosureBasePath(self.search_paths)
    for dep in calcdeps.BuildDependenciesFromFiles(self.search_paths):
      add_dependency.append(calcdeps.GetDepsLine(dep, base_path))
    add_dependency = '\n'.join(add_dependency)
    # Find the Blockly directory name and replace it with a JS variable.
    # This allows blockly_uncompressed.js to be compiled on one computer and be
    # used on another, even if the directory name differs.
    m = re.search('[\\/]([^\\/]+)[\\/]core[\\/]blockly.js', add_dependency)
    add_dependency = re.sub('([\\/])' + re.escape(m.group(1)) +
        '([\\/]core[\\/])', '\\1" + dir + "\\2', add_dependency)
    f.write(add_dependency + '\n')

    provides = []
    for dep in calcdeps.BuildDependenciesFromFiles(self.search_paths):
      if not dep.filename.startswith('../'):
        provides.extend(dep.provides)
    provides.sort()
    f.write('\n')
    f.write('// Load Blockly.\n')
    for provide in provides:
      f.write('goog.require(\'%s\');\n' % provide)

    f.write("""
delete window.BLOCKLY_DIR;
delete window.BLOCKLY_BOOT;
};

document.write('<script type="text/javascript" src="' + window.BLOCKLY_DIR +
    '/../closure-library/closure/goog/base.js"></script>');
document.write('<script type="text/javascript">window.BLOCKLY_BOOT()</script>');
""")
    f.close()
    print 'SUCCESS: ' + target_filename


class Gen_compressed():
  """Generate a JavaScript file that contains all of Blockly's core and all
  required parts of Closure, compiled together.
  Uses the Closure Compiler's online API.
  Runs in a separate thread.
  """
  def __init__(self, search_paths):
    self.search_paths = search_paths

  def run(self):
    self.gen_core()
    self.gen_generator('javascript')
    self.gen_generator('python')
    self.gen_generator('whalesong')
    self.gen_generator('ray')
    self.gen_language('en')

  def gen_core(self):
    target_filename = 'blockly_compressed.js'
    # Read in all the source files.
    filenames = calcdeps.CalculateDependencies(self.search_paths,
        ['core/blockly.js'])

    if needs_compile(target_filename, filenames):
      self.do_compile_local(target_filename, filenames)

  def gen_generator(self, language):
    target_filename_compressed = language + '_compressed.js'
    target_filename_uncompressed = language + '_uncompressed.js'
    # Read in all the source files.
    filenames = glob.glob('./generators/%s/*.js' % language)
    filenames.insert(0, './generators/%s.js' % language)

    if needs_compile(target_filename_uncompressed, filenames):
      with open(target_filename_uncompressed, 'wt') as fout:
        for line in fileinput.input(filenames, mode='r'):
          fout.write(line)
      print "SUCCESSFULLY COMPILED: %s" % target_filename_uncompressed

    if needs_compile(target_filename_compressed, filenames):
      self.do_compile_local(target_filename_compressed, filenames)

  def gen_language(self, language):
    target_filename = language + '_compressed.js'
    # Read in all the source files.
    filenames = glob.glob('./language/common/*.js')
    filenames += glob.glob('./language/%s/*.js' % language)
    filenames.remove('./language/%s/_messages.js' % language)
    filenames.insert(0, './language/%s/_messages.js' % language)

    if needs_compile(target_filename, filenames):
      self.do_compile_local(target_filename, filenames)

  def do_compile_local(self, target_filename, filenames):
    # print "Target filename:", target_filename
    # print "Filenames:", filenames    
    response = subprocess.check_call(['java', '-jar', '../compiler.jar'] +
                                     ['--js'] + filenames +
                                     ['--js_output_file', target_filename])
    if not response:
      print "SUCCESSFULLY COMPILED: %s" % target_filename
    else: 
      print "ERROR DURING COMPILATION: %s" % target_filename

if __name__ == '__main__':
  try:
    calcdeps = import_path(
          '../closure-library/closure/bin/calcdeps.py')
  except ImportError:
    print """Error: Closure not found.  Read this:
http://code.google.com/p/blockly/wiki/Closure"""
    sys.exit(1)
  search_paths = calcdeps.ExpandDirectories(
      ['core/', '../closure-library/'])

  Gen_uncompressed(search_paths).run()
  Gen_compressed(search_paths).run()
