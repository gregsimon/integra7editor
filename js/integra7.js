
var midiAccess = null;
var midiIn = null;
var midiOut = null;
var selectMIDIIn = null;
var selectMIDIOut = null;
var deviceId = 17;
var studioSetControlChannel = 16;

function integra7_init() {
	if (navigator.requestMIDIAccess)
   		navigator.requestMIDIAccess({sysex: true}).then( onMIDIInit, onMIDIFail );
}

var g_next_midi_callback_fn = undefined;

function midiMessageReceived(event) {
	/*console.log("MIDI MESSAGE IN "+(event.data.length-13)+
      " addr "+event.data[7].toString(16)+" "+
      event.data[8].toString(16)+" "+
      event.data[9].toString(16)+" "+event.data[10].toString(16)) ;*/

  if (g_next_midi_callback_fn != undefined)
    g_next_midi_callback_fn(event);
}

var categories = [
"No assign",          // 00000
"Ac. Piano",          // 00001
"E. Piano",           // 00010
"Organ",              // 00011
"Other Keyboards",    // 00100
"Accordion/Harmonica",// 00101 
"Bell/Mallet",        // 00110
"Ac. Guitar",         // 00111
"E. Guitar",          // 01000
"Dist Guitar",        // 01001
"Ac. Bass",           // 01010
"E. Bass",            // 01011
"Synth Bass",         // 01100
"Plucked/Stroke",     // 01101
"Strings",            // 01110
"Brass",              // 01111
"Wind",               // 10000
"Flute", 
"Sax", 
"Recorder",
"Vox/Choir", 
"Synth Lead", 
"Synth Brass", 
"Synth Pad/Strings", 
"Synth Bellpad",
"Synth PolyKey", 
"FX", 
"Synth Seq/Pop", 
"Phrase", 
"Pulsating", 
"Beat & Groove", 
"Hit", 
"Sound FX", 
"Drums", 
"Percussion", 
"Combination"
];

var g_lsb_range;
var g_lsb;
var g_msb;
var g_pc_range;
var g_pc;
var g_group;
var g_cat_offset;

var total_tones = 0;

/*
SN-A
 BANK SELECT     | PROGRAM   | GROUP                      | NUMBER
 MSB | LSB       | NUMBER    |                            | 
-----+-----------+-----------+----------------------------+-------------
 089 | 000 - 001 | 001 - 128 | User SN Acoustic Tone      | 0001 - 0256
-----+-----------+-----------+----------------------------+-------------
 089 | 064 - 065 | 001 - 128 | Preset SN Acoustic Tone    | 0001 - 0256
*/
function collectSNA_Preset(){
  g_msb_range = [89, 89];
  g_msb = 89;
  g_lsb_range = [64, 65];
  g_lsb = 64;
  g_pc_range = [0, 127];
  g_pc = 0;
  g_group = "sna";
  g_cat_offset = -1;

  load_part(g_msb, g_lsb, g_pc);
  read_name(g_group);
}



/*
SN-S
 BANK SELECT     | PROGRAM   | GROUP                      | NUMBER
 MSB | LSB       | NUMBER    |                            | 
-----+-----------+-----------+----------------------------+-------------
 095 | 000 - 003 | 001 - 128 | User SN Synth Tone         | 0001 - 0512
-----+-----------+-----------+----------------------------+-------------
 095 | 064       | 001 - 128 | Preset SN Synth Tone       | 0001 - 0128
     | :         | :         |                            | : 
 095 | 072       | 001 - 085 |                            | 1025 - 1109
*/
function collectSNS_Preset() {
  g_msb_range = [95, 95];
  g_msb = 95;
  g_lsb_range = [64, 72];
  g_lsb = 64;
  g_pc_range = [0, 127];
  g_pc = 0;
  g_group = "sns";
  g_cat_offset = 0x36;

  load_part(g_msb, g_lsb, g_pc);
  read_name(g_group);
}

/*
 SN-D
 BANK SELECT     | PROGRAM   | GROUP                      | NUMBER
 MSB | LSB       | NUMBER    |                            | 
-----+-----------+-----------+----------------------------+-------------
 088 | 000       | 001 - 064 | User SN Drum Kit           | 0001 - 0064
-----+-----------+-----------+----------------------------+-------------
 088 | 064       | 001 - 026 | Preset SN Drum Kit         | 0001 - 0026
*/
function collectSND_Preset() {
  g_msb_range = [88, 88];
  g_msb = 88;
  g_lsb_range = [64, 64];
  g_lsb = 64;
  g_pc_range = [0, 25];
  g_pc = 0;
  g_group = "snd";
  g_cat_offset = -1;

  load_part(g_msb, g_lsb, g_pc);
  read_name(g_group);
}

/*
 PCM-S
 BANK SELECT     | PROGRAM   | GROUP                      | NUMBER
 MSB | LSB       | NUMBER    |                            | 
-----+-----------+-----------+----------------------------+-------------
 087 | 000 - 001 | 001 - 128 | User PCM Synth Tone        | 0001 - 0256
-----+-----------+-----------+----------------------------+-------------
 087 | 064 - 070 | 001 - 128 | Preset PCM Synth Tone      | 0001 - 0896
-----+-----------+-----------+----------------------------+-------------
 121 | 000 -     | 001 - 128 | GM2 Tone                   | 0001 - 0256
*/
function collectPCMS_Preset() {
  g_msb_range = [87, 87];
  g_msb = 87;
  g_lsb_range = [64, 70];
  g_lsb = 64;
  g_pc_range = [0, 127];
  g_pc = 0;
  g_group = "pcms";
  g_cat_offset = -1;

  load_part(g_msb, g_lsb, g_pc);
  read_name(g_group);
}

/*
 PCM-DRUM
 BANK SELECT     | PROGRAM   | GROUP                      | NUMBER
 MSB | LSB       | NUMBER    |                            | 
-----+-----------+-----------+----------------------------+-------------
 086 | 000       | 001 - 032 | User PCM Drum Kit          | 0001 - 0032
-----+-----------+-----------+----------------------------+-------------
 086 | 064       | 001 - 014 | Preset PCM Drum Kit        | 0001 - 0014
-----+-----------+-----------+----------------------------+-------------
 120 | 000       | 001 - 057 | GM2 Drum Kit               | 0001 - 0009

*/
function collectPCMD_Preset() {
  g_msb_range = [86, 86];
  g_msb = 86;
  g_lsb_range = [64, 64];
  g_lsb = 64;
  g_pc_range = [0, 13];
  g_pc = 0;
  g_group = "pcmd";
  g_cat_offset = -1;

  load_part(g_msb, g_lsb, g_pc);
  read_name(g_group);
}


/*
BANK SELECT | PROGRAM | GROUP | NUMBER
MSB|LSB |NUMBER | | -----+-----------+-----------+----------------------------+-------------
093 | 000 | 001 - 041 | Expansion PCM Tone (SRX01) | 0001 - 0041
092 | 000 | 001 - 079 | Expansion PCM Drum (SRX01) | 0001 - 0079
*/
function collectSRX01_Tone() {
  g_msb_range = [93, 93];
  g_msb = 93;
  g_lsb_range = [0, 0];
  g_lsb = 0;
  g_pc_range = [0, 40];
  g_pc = 0;
  g_group = "pcms";
  g_cat_offset = -1;

  load_part(g_msb, g_lsb, g_pc);
  read_name(g_group);
}
/*
BANK SELECT | PROGRAM | GROUP | NUMBER
MSB |LSB  | NUMBER    | | -----+-----------+-----------+----------------------------+-------------
093 | 002 | 001 - 128 | Expansion PCM Tone (SRX03) | 0001 - 0128 
092 | 002 | 001 - 012 | Expansion PCM Drum (SRX03) | 0001 - 0012
*/
function collectSRX03_Tone() {
  g_msb_range = [93, 93];
  g_msb = 93;
  g_lsb_range = [2, 2];
  g_lsb = 2;
  g_pc_range = [0, 127];
  g_pc = 0;
  g_group = "pcms";
  g_cat_offset = -1;

  load_part(g_msb, g_lsb, g_pc);
  read_name(g_group);
}

// ------------------------------------------------------------------------

var g_patch_name;

g_next_midi_callback_fn = function(event) {

  var category;

  if (event.data.length == 12+13) {
    // This is the name of the patch
    total_tones ++;
    g_patch_name = String.fromCharCode.apply(null, event.data.subarray(11, 23));

  } else {
    // this is the category.
    category = event.data[11];

    console.log(g_patch_name+" cat="+category);

    g_pc++;
    if (g_pc > g_pc_range[1]) {
      g_pc = g_pc_range[0];
      // now update lsb.
      g_lsb++;
      if (g_lsb > g_lsb_range[1]) {
        g_lsb = g_lsb_range[0];
        // now update msb.
        g_msb++;
        if (g_msb >= g_msb_range[1]) {
          // we're done.
          g_msb=-1
        }
      }
    }
  
    if (g_msb >= 0) {
      // continue...
      load_part(g_msb, g_lsb, g_pc);
      read_name(g_group);
    }
  }

};



function load_part(msb, lsb, pc) {
  var ch = 0;
  midiOut.send([0xb0|ch, 0x00, msb]);
  midiOut.send([0xb0|ch, 0x20, lsb]);
  midiOut.send([0xc0|ch, pc]);
}

function read_name(engineName) {
  // We're going to read memory from the Integra using sysex.
  // 19 00 00 00 | Temporary Tone (Part 1) 
  // based on what the engine is, the contents will be at 
  // different addresses:
  // 00 00 00 | Temporary PCM Synth Tone |
  // 01 00 00 | Temporary SuperNATURAL Synth Tone |
  // 02 00 00 | Temporary SuperNATURAL Acoustic Tone |
  // 03 00 00 | Temporary SuperNATURAL Drum Kit |
  // 10 00 00 | Temporary PCM Drum Kit

  if (engineName == "sna") {
    // 19 02 00 00

    // read first 12 bytes -- this is the name!
    sendSYSEXwithRolandChecksum([0xf0, 0x41, 16, 
        0x00, 0x00, 0x64, // model 1,2,3
        0x11, // cmd -> RQ1
        0x19, 0x02, 0x00, 0x00, // addr
        0x00, 0x00, 0x00, 12, // size
        0x00, // checksum
        0xf7
        ]);
    sendSYSEXwithRolandChecksum([0xf0, 0x41, 16, 
        0x00, 0x00, 0x64, // model 1,2,3
        0x11, // cmd -> RQ1
        0x19, 0x02, 0x00, 0x1b, // addr
        0x00, 0x00, 0x00, 1, // size
        0x00, // checksum
        0xf7
        ]);

  }

  if (engineName == "sns") {
    // 19 01 00 00

    // read first 12 bytes -- this is the name!
    sendSYSEXwithRolandChecksum([0xf0, 0x41, 16, 
        0x00, 0x00, 0x64, // model 1,2,3
        0x11, // cmd -> RQ1
        0x19, 0x01, 0x00, 0x00, // addr
        0x00, 0x00, 0x00, 12, // size
        0x00, // checksum
        0xf7
        ]);
    sendSYSEXwithRolandChecksum([0xf0, 0x41, 16, 
        0x00, 0x00, 0x64, // model 1,2,3
        0x11, // cmd -> RQ1
        0x19, 0x01, 0x00, 0x36, // addr
        0x00, 0x00, 0x00, 1, // size
        0x00, // checksum
        0xf7
        ]);
  }

  if (engineName == "snd") {
    // 19 03 00 00

    // read first 12 bytes -- this is the name!
    sendSYSEXwithRolandChecksum([0xf0, 0x41, 16, 
        0x00, 0x00, 0x64, // model 1,2,3
        0x11, // cmd -> RQ1
        0x19, 0x03, 0x00, 0x00, // addr
        0x00, 0x00, 0x00, 12, // size
        0x00, // checksum
        0xf7
        ]);
    sendSYSEXwithRolandChecksum([0xf0, 0x41, 16, 
        0x00, 0x00, 0x64, // model 1,2,3
        0x11, // cmd -> RQ1
        0x19, 0x03, 0x00, 0x0c, // addr
        0x00, 0x00, 0x00, 1, // size
        0x00, // checksum
        0xf7
        ]);
  }

  if (engineName == "pcms") {
    // 19 00 00 00

    /*
    | 00 00 00 | PCM Synth Tone Common (0x50 80b)
    | 00 02 00 | PCM Synth Tone Common MFX (0x01 0x11) 273
    | 00 10 00 | PCM Synth Tone PMT (Partial Mix Table) (0x29) 41
    | 00 20 00 | PCM Synth Tone Partial (Partial 1) (01 1a) 282
    | 00 22 00 | PCM Synth Tone Partial (Partial 2) (01 1a) 282
    | 00 24 00 | PCM Synth Tone Partial (Partial 3) (01 1a) 282
    | 00 26 00 | PCM Synth Tone Partial (Partial 4) (01 1a) 282
    | 00 30 00 | PCM Synth Tone Common 2 (0x3c) 60
    -> 1582 b total 06 2e
    */

    // read first 12 bytes -- this is the name!
    sendSYSEXwithRolandChecksum([0xf0, 0x41, 16, 
        0x00, 0x00, 0x64, // model 1,2,3
        0x11, // cmd -> RQ1
        0x19, 0x00, 0x00, 0x00, // addr
        0x00, 0x00, 0x00, 12, // size
        0x00, // checksum
        0xf7
        ]);
    sendSYSEXwithRolandChecksum([0xf0, 0x41, 16, 
        0x00, 0x00, 0x64, // model 1,2,3
        0x11, // cmd -> RQ1
        0x19, 0x00, 0x30, 0x10, // addr
        0x00, 0x00, 0x00, 1, // size
        0x00, // checksum
        0xf7
        ]);
  }

  if (engineName == "pcmd") {
    // 19 10 00 00

    // read first 12 bytes -- this is the name!
    sendSYSEXwithRolandChecksum([0xf0, 0x41, 16, 
        0x00, 0x00, 0x64, // model 1,2,3
        0x11, // cmd -> RQ1
        0x19, 0x10, 0x00, 0x00, // addr
        0x00, 0x00, 0x00, 12, // size
        0x00, // checksum
        0xf7
        ]);
    sendSYSEXwithRolandChecksum([0xf0, 0x41, 16, 
        0x00, 0x00, 0x64, // model 1,2,3
        0x11, // cmd -> RQ1
        0x19, 0x10, 0x00, 0x00, // addr
        0x00, 0x00, 0x00, 1, // size
        0x00, // checksum
        0xf7
        ]);
  }

  if (engineName == "srx01") {
    // 19 10 00 00

    // read first 12 bytes -- this is the name!
    sendSYSEXwithRolandChecksum([0xf0, 0x41, 16, 
        0x00, 0x00, 0x64, // model 1,2,3
        0x11, // cmd -> RQ1
        0x19, 0x10, 0x00, 0x00, // addr
        0x00, 0x00, 0x00, 12, // size
        0x00, // checksum
        0xf7
        ]);
    sendSYSEXwithRolandChecksum([0xf0, 0x41, 16, 
        0x00, 0x00, 0x64, // model 1,2,3
        0x11, // cmd -> RQ1
        0x19, 0x10, 0x00, 0x00, // addr
        0x00, 0x00, 0x00, 1, // size
        0x00, // checksum
        0xf7
        ]);
  }

}

// --- MIDI utilities --

// DataRequest RQ1
// f0 41 10 [00 00 64] 11 a1 a2 a3 a4 s1 s2 s3 s4 CK f7

// DataSet DT1
// f0 41 10 [00 00 64] 12 a1 a2 a3 a4 d0 .. dn CK f7

// 

function sendSYSEXwithRolandChecksum(msg) {
	// the message is complete we just need to insert the checksum
  sum = msg[7]+msg[8]+msg[9]+msg[10]+
      msg[11]+msg[12]+msg[13]+msg[14];
  checksum = 128-(sum % 128);
  msg[15] = checksum;
  midiOut.send(msg);
}

function printArrayHex(arr) {
  var s = "";
  for (var i=0; i<arr.length; i++) {
    s += arr[i].toString(16) + " ";
  }
  console.log(s);
}
function onMIDIInit( midi ) {
  var preferredIndex = 0;
  midiAccess = midi;
  selectMIDIIn=document.getElementById("midiIn");
  selectMIDIOut=document.getElementById("midiOut");

  var list=midiAccess.inputs();

  // clear the MIDI input select
  selectMIDIIn.options.length = 0;

  for (var i=0; i<list.length; i++)
    if (list[i].name.toString().indexOf("INTEGRA") != -1)
      preferredIndex = i;

  if (list.length) {
    for (var i=0; i<list.length; i++)
      selectMIDIIn.options[i]=new Option(list[i].name,list[i].fingerprint,i==preferredIndex,i==preferredIndex);

    midiIn = list[preferredIndex];
    midiIn.onmidimessage = midiMessageReceived;

    selectMIDIIn.onchange = changeMIDIIn;
  }

  // clear the MIDI output select
  selectMIDIOut.options.length = 0;
  preferredIndex = 0;
  list=midiAccess.outputs();

  for (var i=0; i<list.length; i++)
    if (list[i].name.toString().indexOf("INTEGRA") != -1)
      preferredIndex = i;

  if (list.length) {
    for (var i=0; i<list.length; i++)
      selectMIDIOut.options[i]=new Option(list[i].name,list[i].fingerprint,i==preferredIndex,i==preferredIndex);

    midiOut = list[preferredIndex];
    selectMIDIOut.onchange = changeMIDIOut;
  }
}

function changeMIDIIn( ev ) {
  var list=midiAccess.inputs();
  var selectedIndex = ev.target.selectedIndex;

  if (list.length >= selectedIndex) {
    midiIn = list[selectedIndex];
    midiIn.onmidimessage = midiMessageReceived;
  }
}

function changeMIDIOut( ev ) {
  var list=midiAccess.outputs();
  var selectedIndex = ev.target.selectedIndex;

  if (list.length >= selectedIndex)
    midiOut = list[selectedIndex];
}

function onMIDIFail( err ) {
  console.log("MIDI failed to initialize: " + err.code);
}