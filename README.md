# slide-machine
(projectile psychotronics)

## What it is
Simple in-browser environment to manage building psychotronic visuals (mainly intended for projection in live performance settings) on the fly.

## Installation

Download the files wherever you like. Open the index.html file in your browser of choice.

## How to Use

### Clips

Clips are the basic building block of the Slide Machine. Each clip is composed of a series of 'frames' (browser-displayable images). Within the **clips** directory are subdirectories - each of these contains the files for that clip. The files must be named as a number with leading zeros + ".jpg". Don't worry about it if they **aren't** jpegs, the browser won't care. This is at least true of bitmap formats, I haven't experimented with svg files or anything as yet. So, for instance, if a given clip has 20 frames, they should be named 01.jpg, 02.jpg, ... 20.jpg. If a clip has 800 frames, 001.jpg, 002.jpg etc.

#### Creating Clips

There are any number of ways to create clips. My methodology is to find an interesting visual sequence in a movie, [open in VLC and set up to export as frames](https://www.google.com/search?q=export+individual+frames+from+vlc). Jamie thinks [Macroplant Adapter](https://macroplant.com/adapter) looks good for this purpose. VLC can be iffy depending on encoding. I've had experience with it choking on some files, spitting out multiple copies of the same frame etc. Whatever you use, you might want to export only every 2nd or 3rd frame as the Slide Machine generally doesn't play back at anything like 25fps.

After creating a clip, you need to reference it in the clips.js file - open this file in a text editor and add to the end of it like so:

  ["some_other_clip",382,1024,568]
  ];
  
  ["some_other_clip",382,1024,568],
  ["my_new_clip",201,600,300]
  ];

Specify your clip like this: [directory name,number of frames,pixel width,pixel height] Note that the last clip array shouldn't have a comma after it. Everything will work as designed if all frames in your clip have the same dimensions. Later you'll be able to mix frames from different clips to create new sequences.

### Sequences

Where a clip is a sequence of frames, typically extracted from an existing video file (could also be generated), a 'sequence' is what the Slide Machine actually plays. On loading, all clips are included as sequences. Soon I'll be adding tools to allow you to edit together new sequences, grab individual frames from clips, etc.

### Layers

All of the visuals are composed of layered images with different opacities. Initially, there is only one layer, numbered 0, but layers can be added/removed on the fly.

### Layer Properties

Layers have properties relating to playback (e.g. normal, reverse, random) and effects (e.g. opacity, zoom, orientation)

### A Tour of the UI



