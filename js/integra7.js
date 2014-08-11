
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

function midiMessageReceived(event) {
	console.log("MIDI MESSAGE IN "+event.data.length);

  //for (i=0; i<12; i++) {
    console.log(String.fromCharCode.apply(null, event.data.subarray(11, 23)));
  //}
}

/*
SN-A
 BANK SELECT     | PROGRAM   | GROUP                   | NUMBER
 MSB | LSB       | NUMBER    |                         | 
-----+-----------+-----------+----------------------------+-------------
 089 | 000 - 001 | 001 - 128 | User SN Acoustic Tone    | 0001 - 0256
-----+-----------+-----------+----------------------------+-------------
 089 | 064 - 065 | 001 - 128 | Preset SN Acoustic Tone  | 0001 - 0256

SN-S
 BANK SELECT     | PROGRAM   | GROUP                   | NUMBER
 MSB | LSB       | NUMBER    |                         | 
-----+-----------+-----------+----------------------------+-------------
 095 | 000 - 003 | 001 - 128 | User SN Synth Tone | 0001 - 0512
-----+-----------+-----------+----------------------------+-------------
 095 | 064 | 001 - 128 | Preset SN Synth Tone | 0001 - 0128
 | : | : | | : 
 095 | 072 | 001 - 085 | | 1025 - 1109

 SN-D
 BANK SELECT     | PROGRAM   | GROUP                   | NUMBER
 MSB | LSB       | NUMBER    |                         | 
-----+-----------+-----------+----------------------------+-------------
 088 | 000 | 001 - 064 | User SN Drum Kit | 0001 - 0064
-----+-----------+-----------+----------------------------+-------------
 088 | 064 | 001 - 026 | Preset SN Drum Kit | 0001 - 0026

 PCM-S
 BANK SELECT     | PROGRAM   | GROUP                   | NUMBER
 MSB | LSB       | NUMBER    |                         | 
-----+-----------+-----------+----------------------------+-------------
 087 | 000 - 001 | 001 - 128 | User PCM Synth Tone | 0001 - 0256
-----+-----------+-----------+----------------------------+-------------
 087 | 064 - 070 | 001 - 128 | Preset PCM Synth Tone | 0001 - 0896
-----+-----------+-----------+----------------------------+-------------
 121 | 000 - | 001 - 128 | GM2 Tone | 0001 - 0256

 PCM-DRUM
 BANK SELECT     | PROGRAM   | GROUP                   | NUMBER
 MSB | LSB       | NUMBER    |                         | 
-----+-----------+-----------+----------------------------+-------------
 086 | 000 | 001 - 032 | User PCM Drum Kit | 0001 - 0032
-----+-----------+-----------+----------------------------+-------------
 086 | 064 | 001 - 014 | Preset PCM Drum Kit | 0001 - 0014
-----+-----------+-----------+----------------------------+-------------
 120 | 000 | 001 - 057 | GM2 Drum Kit | 0001 - 0009

*/
function load_bank(bank) {
  var ch = 0;

  if (bank == "sna") {

    midiOut.send([0xb0|ch, 0x00, 89, 
                  0xb0|ch, 0x20, 64]);
    midiOut.send([0xc0|ch, 45]);
  }
  if (bank == "sns") {

    midiOut.send([0xb0|ch, 0x00, 95, 
                  0xb0|ch, 0x20, 64]);
    midiOut.send([0xc0|ch, 1]);
  }

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


  }

}
function load_part() {
  var channel = 1;

  // SN-A
  // Bank 089 000-001   PN 0x01 - 0x80


  
  //midiOut.send([0x90, 64, 64]);// note on
  //midiOut.send([0x90, 64, 00]);// note off





	//sendSYSEXwithRolandChecksum([0x0, 0xa0], [0x0a, 1, 2, 3]);
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