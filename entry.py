import os
import logging

from google.appengine.ext import ndb 
from google.appengine.api import users

import webapp2
import jinja2

DEVELOPMENT = True

JINJA_ENV = jinja2.Environment(
  loader=jinja2.FileSystemLoader(os.path.dirname(__file__)),
  extensions=['jinja2.ext.autoescape'])

def escape_double_quotes(string):
  return string.replace('"', '\\"')
JINJA_ENV.filters['escape_double_quotes'] = escape_double_quotes

class Program(ndb.Model):
  source = ndb.TextProperty()




class MainPage(webapp2.RequestHandler):
  def get(self):
    user = users.get_current_user()
    if user:
      program = Program.get_or_insert(user.user_id())

      if program.source:
        logging.debug('Program has source!')
        logging.debug(program.source)
        logging.debug(escape_double_quotes(program.source))

      template = JINJA_ENV.get_template('demo_template.html')
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


application = webapp2.WSGIApplication([
  ('/', MainPage),
], debug=True)
