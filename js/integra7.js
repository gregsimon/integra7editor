"Copyright 2014 Greg Simon"


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
  if (g_bank_timeout_id != undefined)
    clearTimeout(g_bank_timeout_id);
  g_bank_timeout_id = undefined;

	/*console.log("MIDI MESSAGE IN "+(event.data.length-13)+
      " addr "+event.data[7].toString(16)+" "+
      event.data[8].toString(16)+" "+
      event.data[9].toString(16)+" "+event.data[10].toString(16)) ;
  */

  if (g_next_midi_callback_fn != undefined)
    g_next_midi_callback_fn(event);
}

var g_bank_index =-1;
var g_bank_collection_fns = [
  {fn:collectSNA_Preset, type:"Preset", eng:"SuperNATURAL-Acoustic"},
/*  {fn:collectSNS_Preset, type:"Preset", eng:"SuperNATURAL-Synth"},
  {fn:collectSNS_User, type:"User", eng:"SuperNATURAL-Synth"},
  {fn:collectSND_Preset, type:"Preset", eng:"SuperNATURAL-Drums"},
  {fn:collectSND_User, type:"User", eng:"SuperNATURAL-Drums"},
  {fn:collectPCMS_Preset, type:"Preset", eng:"PCM-Synth"},
  {fn:collectPCMS_User, type:"User", eng:"PCM-Synth"},
  {fn:collectPCMD_Preset, type:"Preset", eng:"PCM-Drums"},
  {fn:collectPCMD_User, type:"User", eng:"PCM-Drums"},

  {fn:collectSRX01_Tone, type:"SRX", eng:"SRX01"},
  {fn:collectSRX02_Tone, type:"SRX", eng:"SRX02"},
  {fn:collectSRX03_Tone, type:"SRX", eng:"SRX03"},
  {fn:collectSRX03_Drum, type:"SRX", eng:"SRX03 Drums"},
  {fn:collectSRX04_Tone, type:"SRX", eng:"SRX04"},
  {fn:collectSRX05_Tone, type:"SRX", eng:"SRX05"},
  {fn:collectSRX05_Drum, type:"SRX", eng:"SRX05 Drums"},
  {fn:collectSRX06_Tone, type:"SRX", eng:"SRX06"},
  {fn:collectSRX06_Drum, type:"SRX", eng:"SRX06 Drums"},
  {fn:collectSRX07_Tone, type:"SRX", eng:"SRX07"},
  {fn:collectSRX07_Drum, type:"SRX", eng:"SRX07 Drums"},
  {fn:collectSRX08_Tone, type:"SRX", eng:"SRX08"},
  {fn:collectSRX08_Drum, type:"SRX", eng:"SRX08 Drums"},
  {fn:collectSRX09_Tone, type:"SRX", eng:"SRX09"},
  {fn:collectSRX10_Tone, type:"SRX", eng:"SRX10"},
  {fn:collectSRX11_Tone, type:"SRX", eng:"SRX11"},
  {fn:collectSRX12_Tone, type:"SRX", eng:"SRX12"}, */
  undefined
];

var g_tones = [];

// This is the kick-off function that builds
// the entire script. It collects all banks that are available
// building a giant database, then writes out the database 
// in a Cubase-friendly fashion.
function build_script() {
  g_tones = [];
  g_bank_index = 0;
  var bank = g_bank_collection_fns[g_bank_index];
  
  document.getElementById('s1').innerText = ("collecting "+bank.eng+" "+bank.type);

  bank.fn();
}

function collect_next_bank() {
  if (g_bank_index == -1 )
    return;

  g_bank_index++;
  var bank = g_bank_collection_fns[g_bank_index];
  if (bank != undefined) {
    document.getElementById('s1').innerText = ("collecting "+bank.eng+" "+bank.type);
    bank.fn();
  } else {
    console.log("complete, collected " + g_tones);

    generate_patch_script();
  } 
}


function generate_patch_script() {
  s = "[cubase parse file]\x0a\x0a\
[parser version 0001]\x0a\x0a\
[creators first name]Greg\x0a\x0a\
[creators last name]Simon\x0a\x0a\
[device manufacturer]ROLAND\x0a\x0a\
[device name]Integra 7\x0a\x0a\
[script name]ROLAND Integra 7\x0a\x0a\
[script version]version 1.00\x0a\x0a\
\x0a\x0a\
[define patchnames]\x0a\x0a\
\x0a\x0a\
[mode]\tPatches\x0a\x0a\
[g1]\t\tPatches 1\x0a\x0a\
";

  for (i=0; i<g_tones.length; ++i) {
    var r = g_tones[i];
    s += "[p2, "+r.pc+", "+r.msb.toString(10)+", "+
        r.lsb.toString(10)+"]\t"+r.name+"\x0a\x0a"
  }

  s += "\x0a\x0a[end]\x0a\x0a";

  var blob = new Blob([s], {type: "text/plain;charset=utf-8"});
  saveAs(blob, "roland integra-7.txt");
}

var categories = [
"No assign",          // 00000
"PNO",          // 00001
"EP",           // 00010
"Organ",              // 00011
"EP",    // 00100
"EP",// 00101 
"ORG",        // 00110
"ORG",         // 00111
"E. Guitar",          // 01000
"KEY",        // 01001
"KEY",           // 01010
"E. Bass",            // 01011
"ACC",         // 01100
"ACC",     // 01101
"BEL",            // 01110
"BEL",              // 01111
"AGT",               // 10000
"EGT", 
"DGT", 
"Ac.BS",
"E.BS", 
"Syn.BS", 
"PLK", 
"STR", 
"STR",
"STR", 
"BRS", 
"BRS", 
"WND", 
"FLT", 
"SAX", 
"HIT", 
"DRM", // DRM or VOX?
"VOX", 
"Syn.PAD", 
"Syn.BRS",
"Syn.PAD",
"BELLPAD",
"POLYKEY",// 100110
"FX",
"Syn.SEQ",
"PHR",
"PLS",
"BTS",
"HIT",
"SFX",
"DRM",
"PRC",
"48",
"49",
"50",
"51",
"52",
"53",
"54",
"55",
"56",
"57",
"58",
"59",
"60",
"61",
"62",
"63",
"64",
"65",
"66",
"67",
"68",
"69",
"70",
"71",
"72",
"73",
"DRM",
"75",
"76",
"77",
"78",
"DRM",
"DRM",
"81",
"DRM",
"83",
"84",
"85",
"86",
"87",
"DRM",
"89",
"90",
"91",
"92",
"93",
"94",
"PRC"


];

var g_lsb_range;
var g_lsb;
var g_msb;
var g_pc_range;
var g_pc;
var g_instr_type;
var g_cat_offset;
var g_patch_name;
var g_bank_timeout_id = undefined;

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
  collect_bank([89,89],[64,65],[0,127],'sna');
}
function collectSNA_User(){
  collect_bank([89,89],[0,1],[0,127],'sna');
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
  collect_bank([95,95],[64,72],[0,127],'sns');
}
function collectSNS_User() {
  collect_bank([95,95],[0,3],[0,127],'sns');
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
  collect_bank([88,88],[64,64],[0,25],'snd');
}
function collectSND_User() {
  collect_bank([88,88],[0,0],[0,63],'snd');
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
  collect_bank([87,87],[64,70],[0,127],'pcms');
}
function collectPCMS_User() {
  collect_bank([87,87],[0,1],[0,127],'pcms');
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
  collect_bank([86,86], [64,64], [0,13], 'pcmd');
}
function collectPCMD_User() {
  collect_bank([86,86], [0,0], [0,31], 'pcmd');
}


/*
BANK SELECT | PROGRAM | GROUP | NUMBER
MSB|LSB |NUMBER | | -----+-----------+-----------+----------------------------+-------------
093 | 000 | 001 - 041 | Expansion PCM Tone (SRX01) | 0001 - 0041
092 | 000 | 001 - 079 | Expansion PCM Drum (SRX01) | 0001 - 0079
*/
function collectSRX01_Tone() {
  collect_bank([93,93], [0,0],[0,40],'pcms');
}
function collectSRX01_Drum() {
  collect_bank([92,92], [0,0],[0,78],'pcmd');
}
/*
BANK SELECT | PROGRAM | GROUP | NUMBER
MSB |LSB  | NUMBER    | | -----+-----------+-----------+----------------------------+-------------
093 | 001 | 001 - 050 | Expansion PCM Tone (SRX02) | 0001 - 0050
*/
function collectSRX02_Tone() {
  collect_bank([93,93], [1,1],[0,49],'pcms');
}
/*
BANK SELECT | PROGRAM | GROUP | NUMBER
MSB |LSB  | NUMBER    | | -----+-----------+-----------+----------------------------+-------------
093 | 002 | 001 - 128 | Expansion PCM Tone (SRX03) | 0001 - 0128 
092 | 002 | 001 - 012 | Expansion PCM Drum (SRX03) | 0001 - 0012
*/
function collectSRX03_Tone() {
  collect_bank([93,93], [2,2],[0,127],'pcms');
}
function collectSRX03_Drum() {
  collect_bank([92,92], [2,2],[0,11],'pcmd');
}
/*
BANK SELECT | PROGRAM | GROUP | NUMBER
MSB |LSB  | NUMBER    | | -----+-----------+-----------+----------------------------+-------------
093 | 003 | 001 - 128 | Expansion PCM Tone (SRX04) | 0001 - 0128
*/
function collectSRX04_Tone() {
  collect_bank([93,93], [3,3],[0,127],'pcms');
}
/*
093 | 004 | 001 - 128 | Expansion PCM Tone (SRX05) | 0001 - 0128
    |:    | :         |                            | :
    | 006 | 001 - 056 |                            | 0257-0312 
092 | 004 | 001 - 034 | Expansion PCM Drum (SRX05) | 0001 - 0034
*/
function collectSRX05_Tone() {
  collect_bank([93,93],[4,6],[0,127],'pcms');
}
function collectSRX05_Drum() {
  collect_bank([92,92],[2,2],[0,11],'pcmd');
}
/*
093 | 007 | 001 - 128 | Expansion PCM Tone (SRX06) | 0001 - 0128 
    | :   | :         |                            |:
    | 010 | 001-065   |                            |0385-0449 
092 | 007 | 001 - 005 | Expansion PCM Drum (SRX06) | 0001 - 0005
*/
function collectSRX06_Tone() {
  collect_bank([93,93],[7,10],[0,127],'pcms');
}
function collectSRX06_Drum() {
  collect_bank([92,92],[7,7],[0,4],'pcmd');
}
/*
093 | 011 | 001 - 128 | Expansion PCM Tone (SRX07) | 0001 - 0128 
    | :   |  :        |                            | :
    | 014 |001-091    |                            | 0385-0475 
092 | 011 | 001 - 011 | Expansion PCM Drum (SRX07) | 0001 - 001
*/
function collectSRX07_Tone() {
  collect_bank([93,93],[11,14],[0,127],'pcms');
}
function collectSRX07_Drum() {
  collect_bank([92,92],[11,11],[0,10],'pcmd');
}
/*
93  | 015 | 001 - 128 | Expansion PCM Tone (SRX08)  | 0001 - 0128 
    |  :  | :         |                             | :
    |018  | 001-064   |                             | 0385-0448 
092 | 015 | 001 - 021 | Expansion PCM Drum (SRX08) | 0001 - 0021
*/
function collectSRX08_Tone() {
  collect_bank([93,93],[15,18],[0,127],'pcms');
}
function collectSRX08_Drum() {
  collect_bank([92,92],[15,15],[0,20],'pcmd');
}
/*
093  | 019 | 001 - 128 | Expansion PCM Tone (SRX09) | 0001 - 0128 
     |:    |:          |                            |  :
     | 022 | 001-030   |                            | 0385-0414 
092  | 019 | 001 - 012 | Expansion PCM Drum (SRX09) | 0001 - 001
*/
function collectSRX09_Tone() {
  collect_bank([93,93],[19,22],[0,127],'pcms');
}
function collectSRX09_Drum() {
  collect_bank([92,92],[19,19],[0,11],'pcmd');
}
/*
093 | 023 | 001 - 100 | Expansion PCM Tone (SRX10) | 0001 - 0100
*/
function collectSRX10_Tone() {
  collect_bank([93,93],[23,23],[0,99],'pcms');
}
/*
093 | 024 | 001 - 042 | Expansion PCM Tone (SRX11) | 0001 - 0042
*/
function collectSRX11_Tone() {
  collect_bank([93,93],[24,24],[0,41],'pcms');
}
/*
093 | 026 | 001 - 050 | Expansion PCM Tone (SRX12) | 0001 - 0050
*/
function collectSRX12_Tone() {
  collect_bank([93,93],[26,26],[0,49],'pcms');
}

/*
089  |096        |001-017    |ExpansionSNTone(ExSN1)      |0001-0017 
-----+-----------+-----------+----------------------------+------------- 
089  |097        |001-017    |ExpansionSNTone(ExSN2)      |0001-0017 
-----+-----------+-----------+----------------------------+------------- 
089  |098        |001-050    |ExpansionSNTone(ExSN3)      |0001-0050 
-----+-----------+-----------+----------------------------+------------- 
089  |099        |001-012    |ExpansionSNTone(ExSN4)      |0001-0012 
-----+-----------+-----------+----------------------------+------------- 
089  |100        |001-012    |ExpansionSNTone(ExSN5)      |0001-0012 
-----+-----------+-----------+----------------------------+------------- 
088  |101        |001-007    |ExpansionSNDrum(ExSN6)      |0001-0007 
*/
function collect_EXSN1() {
  collect_bank([89,89], [96,96],[0,16],'sna');
}
function collect_EXSN2() {
  collect_bank([89,89], [97,97],[0,16],'sna');
}
function collect_EXSN3() {
  collect_bank([89,89], [98,98],[0,49],'sna');
}
function collect_EXSN4() {
  collect_bank([89,89], [99,99],[0,11],'sna');
}
function collect_EXSN5() {
  collect_bank([89,89], [100,100],[0,11],'sna');
}
function collect_EXSN6() {
  collect_bank([88,88], [101,101],[0,6],'snd');
}

/*
-----+-----------+-----------+----------------------------+------------- 
097  | 000       | 001 - 128 | Expansion PCM Tone (ExPCM) | 0001 - 0128
     | :         |  :        |                            | :
     | 003       | 001 - 128 |                            | 0385 - 0512 
096  | 000       | 001 - 019 | Expansion PCM Drum (ExPCM) | 0001 - 0019
-----+-----------+-----------+----------------------------+------------- 
121  | 000 -     | 001 - 128 | Expansion GM2 Tone (GM2#)  | 0001 - 0256 
120  | 000       | 001-057   |ExpansionGM2Drum(GM2#)      | 0001 - 0009
*/
function collect_ExPCM_Tone() {
  collect_bank([97,97],[0,3],[0,127],'expcm');
}
function collect_ExPCM_Drum() {
  collect_bank([96,96],[0,0],[0,127],'pcmd');
}
function collect_GM2_Tone() {
  collect_bank([121,121],[0,0],[0,127],'pcms');
}
function collect_GM2_Drum() {
  collect_bank([120,120],[0,0],[0,56],'pcmd');
}



// This is general function can kicks off a bank read
// over a range of values. the 'parseType' indicates how 
// the sysex payload is parsed to get the result.
function collect_bank(msb_range, lsb_range, pc_range, instrType) {
  g_msb_range = msb_range;
  g_msb = msb_range[0];
  g_lsb_range = lsb_range;
  g_lsb = lsb_range[0];
  g_pc_range = pc_range;
  g_pc = pc_range[0];
  g_instr_type = instrType;
  load_part(g_msb, g_lsb, g_pc);
  read_name(g_instr_type);

  // start a timeout -- if the message does not come back,
  // then this bank is not available.
  g_bank_timeout_id = setTimeout(bank_timeout, 500);
}

function bank_timeout() {
  clearTimeout(g_bank_timeout_id);
  g_bank_timeout_id = undefined;

  console.log("*** BANK NOT AVAILABLE ***");
  collect_next_bank();
}
// ------------------------------------------------------------------------


g_next_midi_callback_fn = function(event) {

  var category;

  if (event.data.length == 12+13) {
    // This is the name of the patch
    total_tones ++;
    g_patch_name = String.fromCharCode.apply(null, event.data.subarray(11, 23));

  } else {
    // this is the category.
    category = event.data[11] & 0x7f;

    if (g_patch_name != "<<No media>>" && g_patch_name != "INIT TONE   ") {
      console.log(g_msb+" "+g_lsb+" "+g_pc+" '"+g_patch_name+"' cat="+category+" "+categories[category]);

      var t = {};
      t.name = g_patch_name;
      t.msb = g_msb;
      t.lsb = g_lsb;
      t.pc = g_pc;
      t.cat = category;
      t.catName = categories[category];
      g_tones.push(t);
      document.getElementById('s2').innerText = g_tones.length + " Tones"


      // TODO : LOAD SOUND INTO DATABASE
      // g_msb g_lsb g_pc g_patch_name g_category
    }

    g_pc++;
    if (g_pc > g_pc_range[1]) {
      g_pc = g_pc_range[0];
      // now update lsb.
      g_lsb++;
      if (g_lsb > g_lsb_range[1]) {
        g_lsb = g_lsb_range[0];
        // now update msb.
        g_msb++;
        if (g_msb > g_msb_range[1]) {
          // we're done.
          g_msb=-1
        }
      }
    }
  
    if (g_msb >= 0) {
      // continue...
      load_part(g_msb, g_lsb, g_pc);
      read_name(g_instr_type);
    } else {
      // TODO : we are DONE with this bank.
      console.log("**** BANK DONE ****");
      collect_next_bank();
    }
  }

};



function load_part(msb, lsb, pc) {
  var ch = 0;
  midiOut.send([0xb0|ch, 0x00, msb]);
  midiOut.send([0xb0|ch, 0x20, lsb]);
  midiOut.send([0xc0|ch, pc]);
}

// Different sound sources store their name and category
// at different offsets into the payload. 
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

  } else

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
  } else

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
  } else

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
  } else

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
  else 
  if (engineName == "expcm") {
    // 19 00 00 00

    // Note these sounds can't be edited so they 
    // can't be read out?

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

  } else {
    console.log("Read name ... unknown type "+engineName);
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