/*******************************************************************************

  Bare Conductive Pi Cap
  ----------------------

  tts.js - touch triggered text-to-speech synthesis

  Written for Raspberry Pi.

  Bare Conductive code written by Szymon Kaliski.

  This work is licensed under a Creative Commons Attribution-ShareAlike 3.0
  Unported License (CC BY-SA 3.0) http://creativecommons.org/licenses/by-sa/3.0/

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
  THE SOFTWARE.

 *******************************************************************************/

var Gpio         = require('onoff').Gpio;
var execSync     = require('child_process').execSync;
var leftPad      = require('left-pad');
var readFileSync = require('fs').readFileSync;
var times        = require('lodash.times');

var MPR121 = require('node-picap');
var mpr121;

// correct address for the Pi Cap - other boards may vary
mpr121 = new MPR121('0x5C'); 

function speakFile(text) {
  console.log('speaking: ' + text);
  // we call espeak externally due to issues with the espeak library
  execSync('espeak "' + text + '" --stdout | aplay > /dev/null 2>&1');
}

// set up LED
var gpioRed   = new Gpio(6,  'out', 'none', { activeLow: true });
var gpioGreen = new Gpio(5,  'out', 'none', { activeLow: true });
var gpioBlue  = new Gpio(26, 'out', 'none', { activeLow: true });

function lightRGB(r, g, b) {
  gpioRed.write(r);
  gpioGreen.write(g);
  gpioBlue.write(b);
}

// start with LED off
lightRGB(0, 0, 0);

// load the applicable text file when requested
var texts = times(13).map(function(i) {
  var path = 'texts/TEXT' + leftPad(i, 3, 0) + '.txt';
  var text = readFileSync(path, 'utf8');

  return text.replace(/\n/g, ' ');
});

mpr121.on('data', function(data) {
  var isAlreadySpeaking = false;

  data.forEach(function(electrode, i) {
    if (!electrode.isNewTouch) { return; }

    // if we detect a touch, set the LED to red and read the appropriate text file
    if (!isAlreadySpeaking) {
      isAlreadySpeaking = true;

      lightRGB(1, 0, 0);
      speakFile(texts[i]);
    }
  });

  lightRGB(0, 0, 0);
});

// this allows us to exit the program via Ctrl+C while still exiting elegantly
process.on('SIGINT', function () {
  lightRGB(0, 0, 0);
  process.exit(0);
});
