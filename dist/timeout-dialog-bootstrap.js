/*
 * timeout-dialog-bootstrap.js v1.0.0, 03-21-2016
 * 
 * Copyright for portions of timeout-dialog-bootstrap.js are held by Rodrigo Neri (@rigoneri) 
 * as part of project timeout-dialog.js. All other copyright for project 
 * timeout-dialog-bootstrap.js are held by Stephen Womack, 2016.
 * 
 * (The MIT License)
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE. 
 */


/* String formatting, you might want to remove this if you already use it.
 * Example:
 * 
 * var location = 'World';
 * alert('Hello {0}'.format(location));
 */
String.prototype.format = function() {
  var s = this,
      i = arguments.length;

  while (i--) {
    s = s.replace(new RegExp('\\{' + i + '\\}', 'gm'), arguments[i]);
  }
  return s;
};

!function($) {
  $.timeoutDialog = function(options) {

    var settings = {
      timeout: 1200,
      countdown: 60,
      title : 'Your session is about to expire!',
      message : 'You will be logged out in {0}.',
      question: 'Do you want to stay signed in?',
      keep_alive_button_text: 'Yes, Keep me signed in',
      sign_out_button_text: 'No, Sign me out',
      keep_alive_url: '/keep-alive',
      logout_url: null,
      logout_redirect_url: '/',
      restart_on_yes: true
    }  ;  

    $.extend(settings, options);

    var TimeoutDialog = {
      init: function () {
        this.setupDialogTimer();
      }, 
      
      setupDialogTimer: function() {
        var self = this;
        window.setTimeout(function() {
           self.setupDialog();
        }, (settings.timeout - settings.countdown) * 1000);
      },

      // Sets up the bootbox session timeout window.
      setupDialog: function() {
        var self = this;
        self.destroyDialog();
        
        bootbox.dialog({
            closeButton: false,
            message: settings.message.format(self.getTimeString(settings.countdown)) + '<br />' + settings.question,
            title: settings.title,
            className: "session-timout-warning",
            buttons: {
              stayLoggedIn: {
                label: settings.keep_alive_button_text,
                className: "btn-primary",
                callback: function() {
                  self.keepAlive();
                }
              },
              signOut: {
                label: settings.sign_out_button_text,
                className: 'btn-main',
                callback: function() {
                  self.signOut(true);
                }
              }
            }
        });

        self.startCountdown();
      },

      // Destroy's the bootbox window.
      destroyDialog: function() {
        if ($("#timeout-dialog").length) {
          $(this).dialog("close");
          $('#timeout-dialog').remove();
        }
      },
      
      // Gets the minutes and seconds string to display in the countdown.
      getTimeString: function(time) {
          var minutes = Math.floor(time / 60);
          var seconds = time - minutes * 60;
          var returnString = '';
          
          returnString = '<span id="timeout-countdown">';
          
          if(minutes > 0)
          {
              returnString += minutes + ' minutes ';
          }
          
          returnString += seconds + ' seconds</span>';
          
          return returnString;
      },
      
      // Start the countdown timer and change it as it runs every second.
      startCountdown: function() {
        var self = this,
            counter = settings.countdown;

        this.countdown = window.setInterval(function() {
          counter -= 1;
          $("#timeout-countdown").html(self.getTimeString(counter));

          if (counter <= 0) {
            window.clearInterval(self.countdown);
            self.signOut(false);
          }

        }, 1000);
      },

      // Function that keeps the users session active.
      keepAlive: function() {
        var self = this;
        this.destroyDialog();
        window.clearInterval(this.countdown);
        
        $.get(settings.keep_alive_url, function(data) {
          if (data === "OK") {
            if (settings.restart_on_yes) {
              self.setupDialogTimer();
            }
          }
          else {
            // they must already be timed out. Redirect them.
            self.signOut(false);
          }
        })
      },

      // Function used to sign the user out.
      signOut: function(is_forced) {
        var self = this;
        this.destroyDialog();

        if (settings.logout_url !== null) {
            
            $.post(settings.logout_url, function(data){
                self.redirectLogout(is_forced);
            }).fail(function(data){
                console.log(data);
            });
        }
        else {
            self.redirectLogout(is_forced);
        }
      }, 
      
      // Redirects the user to the passed in url.
      redirectLogout: function(is_forced){
        var target = settings.logout_redirect_url + '?next=' + encodeURIComponent(window.location.pathname + window.location.search);
        if (!is_forced)
          target += '&timeout=t';
        window.location = target;
      }
    };

    TimeoutDialog.init();
  };
}(window.jQuery);