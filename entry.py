import cgi
import os
import logging

from google.appengine.ext import ndb 
from google.appengine.api import users

import webapp2
import jinja2

DEVELOPMENT = False
TEMPLATE_DIR = 'templates'
EDITOR_PAGE = 'editor.html'
INDEX_PAGE = 'index.html'

JINJA_ENV = jinja2.Environment(
  loader=jinja2.FileSystemLoader(os.path.join(os.path.dirname(__file__), TEMPLATE_DIR)),
  extensions=['jinja2.ext.autoescape'], 
)
JINJA_ENV.globals['DEVELOPMENT'] = DEVELOPMENT
JINJA_ENV.globals['COMPILED'] = False
JINJA_ENV.globals['USE_LESS'] = True

def datetimeformat(value, fmt="%Y-%m-%d %H:%M:%S"):
  return value.strftime(fmt)
JINJA_ENV.filters['datetimeformat'] = datetimeformat

def escape_double_quotes(string):
  return string.replace('"', '\\"')
JINJA_ENV.filters['escape_double_quotes'] = escape_double_quotes

def make_greeting(user):
  return "Welcome, {}!".format(user.nickname())

def program_editor_url(program):
  return '/editor/' + cgi.escape(program.name)

class User(ndb.Model):
  nickname = ndb.StringProperty()

  @classmethod
  def get_user(cls, google_account):
    user = cls.get_or_insert(google_account.user_id())
    if not user.nickname:
      user.nickname = google_account.nickname()
      user.put()
    return user


class Program(ndb.Model):
  # ancestor will be a User's key
  source = ndb.TextProperty()  
  name = ndb.StringProperty(required=True) # This will be used for the url and therefore should be unique among Programs owned by some user
  last_modified = ndb.DateTimeProperty(auto_now_add=True)


class ProgramEditor(webapp2.RequestHandler):
  def get(self, program_name):
    logging.debug(program_name)
    user = users.get_current_user()
    google_account = users.get_current_user()
    if google_account: 
      user = User.get_user(google_account)
      programs = Program.query(Program.name == program_name, ancestor=user.key)
      if not programs.count():
        self.abort(401)
        
      program = programs.get()      

      if program.source:
        logging.debug('Program has source!')
        logging.debug(program.source)
        logging.debug(escape_double_quotes(program.source))

      template = JINJA_ENV.get_template(EDITOR_PAGE)
      self.response.write(template.render(
        greeting=make_greeting(google_account),
        logoutUrl=users.create_logout_url('/'),
        program_name=program.name,
        source=program.source or None))
    else:
      self.redirect(users.create_login_url(self.request.uri))

  def post(self, program_name):
    source = self.request.get('source')
    logging.debug('Request arguments: ' + str(self.request.arguments()))
    logging.debug(source)
    google_account = users.get_current_user()
    if not google_account:
      self.abort(401)

    user = User.get_user(google_account)      
    if not user:
      self.abort(401)

    programs = Program.query(Program.name == program_name, ancestor=user.key)
    if not programs.count():
      self.abort(401)

    program = programs.get()
    program.source = source
    program.put()

    self.response.headers['Content-Type'] = 'text/plain'
    self.response.write('Program saved!')

class ProgramManager(webapp2.RequestHandler):
  def delete(self, program_name):
    # Delete a program 
    google_account = users.get_current_user()
    if not google_account:
      self.abort(401)

    user = User.get_user(google_account)
    programs = Program.query(Program.name == program_name, ancestor=user.key)
    if not programs.count():
      self.abort(401)

    program = programs.get()
    program.key.delete()

    self.response.write('Success')



class ProgramIndex(webapp2.RequestHandler):

  def get(self):
    # Show the program index
    logging.debug('hello')
    google_account = users.get_current_user()
    if google_account: 
      user = User.get_user(google_account)
      programs = Program.query(ancestor=user.key)
      urls = map(program_editor_url, programs)
      logging.debug('urls: {}'.format(urls))
      template = JINJA_ENV.get_template('index.html')
      self.response.write(template.render(
        programs_and_urls=zip(programs, urls),
        greeting=make_greeting(google_account),
      ))
    else: 
      self.redirect(users.create_login_url(self.request.uri))


  def post(self):
    # Create a new program 
    google_account = users.get_current_user()
    if not google_account:
      self.abort(401)

    user = User.get_user(google_account)
    program_name = self.request.get('program-name')
    program = Program(name=program_name, 
                      parent=user.key)
    program.put()
    self.response.write(program_editor_url(program))


class BlocklyIFrame(webapp2.RequestHandler):
  def get(self, blockly_html):
    logging.debug('blockly_html: {}'.format(blockly_html))
    template = JINJA_ENV.get_template('blockly/' + blockly_html)
    self.response.write(template.render())

application = webapp2.WSGIApplication([
  ('/ray/blockly/(.*\.html)', BlocklyIFrame),
  ('/editor/(.*)', ProgramEditor),
  ('/programs/(.*)', ProgramManager),
  ('/', ProgramIndex),
], debug=True)
