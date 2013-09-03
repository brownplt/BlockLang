import os
import logging

from google.appengine.ext import ndb 
from google.appengine.api import users

import webapp2
import jinja2

DEVELOPMENT = False
TEMPLATE_DIR = 'templates'
EDITOR_PAGE = 'editor.html'

JINJA_ENV = jinja2.Environment(
  loader=jinja2.FileSystemLoader(os.path.join(os.path.dirname(__file__), TEMPLATE_DIR)),
  extensions=['jinja2.ext.autoescape'])

def escape_double_quotes(string):
  return string.replace('"', '\\"')
JINJA_ENV.filters['escape_double_quotes'] = escape_double_quotes

class User(ndb.Model):
  nickname = ndb.StringProperty()

class Program(ndb.Model):
  source = ndb.TextProperty()  
#  name = ndb.StringProperty(required=True) # This will be used for the url and therefore should be unique among Programs owned by some user
  last_modified = ndb.DateTimeProperty(auto_now_add=True)
  user = ndb.KeyProperty(kind=User)


class ProgramEditor(webapp2.RequestHandler):
  def get(self):
    user = users.get_current_user()
    if user:
      program = Program.get_or_insert(user.user_id())

      if program.source:
        logging.debug('Program has source!')
        logging.debug(program.source)
        logging.debug(escape_double_quotes(program.source))

      template = JINJA_ENV.get_template(EDITOR_PAGE)
      self.response.write(template.render(
        DEVELOPMENT=DEVELOPMENT, 
        greeting="Welcome, {}!".format(user.nickname()),
        logoutUrl=users.create_logout_url('/'),
        source=program.source or None))
    else:
      self.redirect(users.create_login_url(self.request.uri))

  def post(self):
    source = self.request.get('source')
    logging.debug('Request arguments: ' + str(self.request.arguments()))
    logging.debug(source)
    
    user = users.get_current_user()
    if not user:
      self.abort(401)

    program = Program.get_or_insert(user.user_id())
    program.source = source
    program.put()

    self.response.headers['Content-Type'] = 'text/plain'
    self.response.write('Program saved!')

class BlocklyIFrame(webapp2.RequestHandler):
  def get(self, blockly_html):
    logging.debug('blockly_html: {}'.format(blockly_html))
    template = JINJA_ENV.get_template('blockly/' + blockly_html)
    self.response.write(template.render(DEVELOPMENT=DEVELOPMENT))

application = webapp2.WSGIApplication([
  ('/ray/blockly/(.*\.html)', BlocklyIFrame),
  ('/editor/', ProgramEditor),
  ('/', ProgramIndex),
], debug=True)
