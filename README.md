# slide-machine
(projectile psychotronics)

## What it is
Simple in-browser environment to manage building psychotronic visuals (mainly intended for projection in live performance settings) on the fly.

## The Name
It's named after the [13th Floor Elevators song "Slide Machine"](https://www.youtube.com/watch?v=0Dh4oc0Pj8k).

## License

Haven't figured out specific license to use yet but my intention is that it be considered public domain, (k) all rights reversed, all propriety waived.

## Installation

Download the files wherever you like. To launch, open the index.html file in your browser of choice. For best results, go to full screen mode (e.g. press F11 in Chrome on Windows)

## Upcoming Features

A few things I'm planning to add soon:
- ability to "record" from currently playing sequence to a buffer in order to be able to build new sequences from bits of other sequences
- ability to record individual frames as above
- ability to record the actual screen as it appears and store as a special sequence
- pre-made complex effects; for instance, zoom + shift patterns, wiggle patterns, slow fade in and out of opacity, etc.
- ability for the user to name and save effects or groups of effects

## How to Use

### Clips

Clips are the basic building block of the Slide Machine. Each clip is composed of a series of 'frames' (browser-displayable images). Within the **clips** directory are subdirectories - each of these contains the files for that clip. The files must be named as a number with leading zeros + ".jpg". Don't worry about it if they **aren't** jpegs, the browser won't care. This is at least true of bitmap formats, I haven't experimented with svg files or anything as yet. So, for instance, if a given clip has 20 frames, they should be named 01.jpg, 02.jpg, ... 20.jpg. If a clip has 800 frames, 001.jpg, 002.jpg etc.

#### Creating Clips

There are any number of ways to create clips. My methodology is to find an interesting visual sequence in a movie, [open in VLC and set up to export as frames](https://www.google.com/search?q=export+individual+frames+from+vlc). Jamie thinks [Macroplant Adapter](https://macroplant.com/adapter) looks good for this purpose. VLC can be iffy depending on encoding. I've had experience with it choking on some files, spitting out multiple copies of the same frame etc. Whatever you use, you might want to export only every 2nd or 3rd frame as the Slide Machine generally doesn't play back at anything like 25fps.

After creating a clip, you need to reference it in the clips.js file - open this file in a text editor and add to the end of it like so:

  ````
  ["some_other_clip",382,1024,568]
  ];
  ````
  
  ````
  ["some_other_clip",382,1024,568],
  ["my_new_clip",201,600,300]
  ];
  ````

Specify your clip like this: [directory name,number of frames,pixel width,pixel height] Note that the last clip array shouldn't have a comma after it. Everything will work as designed if all frames in your clip have the same dimensions. Later you'll be able to mix frames from different clips to create new sequences.

### Sequences

Where a clip is a sequence of frames, typically extracted from an existing video file (could also be generated), a 'sequence' is what the Slide Machine actually plays. On loading, all clips are included as sequences. Soon I'll be adding tools to allow you to edit together new sequences, grab individual frames from clips, etc.

### Layers

All of the visuals are composed of layered images with different opacities. Initially, there is only one layer, numbered 0, but layers can be added/removed on the fly.

### Layer Properties

Layers have properties relating to playback (e.g. normal, reverse, random) and effects (e.g. opacity, zoom, orientation)

### Beats and Cycles

The Slide Machine is intended to be synched to live music (if desired). At any time, you can tap out the beat by tapping the **#** or the **\\** key. Tap it a few times and the beat will be derived from the average space between taps. When the beat is set, the cycle will also be set - one cycle is 1/4 of a beat. A cycle is the basic unit of time, a sequence being played at the fastest rate will advance to the next frame once per cycle. 

### UI

The idea of the UI is that all controls are handled via a single line at the bottom of the screen; this way you can see what you're doing while making live changes but the controls display is pretty unobtrusive where it's being projected (if projecting on a screen you can set up so controls are off screen)

Note that when you launch the Slide Machine, you will need to make sure you have focus on the window so keypresses can be captured. The cursor (mouse pointer) is hidden on the main part of the screen but click there anyhow to make sure you have focus.

Control navigation is set up from left to right, and we'll go through it in order from left to right. The arrow keys are used to navigate through menus. Essentially this is like a tree with the root on the left. So left arrow brings you "down" the tree, right arrow "up" the tree, and up and down arrows change which option or branch (submenu) you select. Enter executes the option. If there is an input, right arrow moves focus into the input. If editing text in an input, the arrow keys will no longer navigate the menus (because arrow keys are used to move around within the input field) - to get back to navigating through the menus, click **Esc**.

Any menu item with options or submenus has a **>** to the right.

#### Key Shortcuts

Because it can take time to navigate through the controls, you can create key shortcuts. When you have a control option active, start typing in letters or numbers. You'll see them appear on the lower right. To create the shortcut, hold shift and press Enter. The shortcut will appear in parentheses after the control option. To clear an existing shortcut on the currently active control option, don't type anything, just hold shift and press Enter.

To use a key shortcut, start typing letters/numbers - you'll see them appear in the lower right of the screen. Then press Enter and if there is a defined key shortcut for that string, that control option will become active. Note that active means that it is selected in the controls, but if it has a function, you still need to press Enter to execute it.

#### Layer Selector

The first control is the Layer Selector, which looks like this: [0]

Up arrow will move up to higher layers (if any), down arrow will move to lower layers.

#### Mode > This Layer >

Set properties of currently selected layer. This includes which sequence is loaded into this layer, how the sequence should be played, effects such as zoom and opacity, and special effects to be applied to the layer.

#### Mode > This Layer > Sequence >

Select which sequence should be loaded into this layer.

#### Mode > This Layer > Playback Settings >

These settings relate to how the sequence is played back:

#### Mode > This Layer > Playback Settings > Frame Delay

Input takes a single integer. Frame Delay dictates the number of cycles before advancing to the next frame. This defaults to 1 which is the fastest. If set to 4, the sequence will be advanced once every four cycles. (Higher numbers are slower).

#### Mode > This Layer > Playback Settings > Frame Advance

Input takes a single integer. Frame Rate dictates how many frames forward the sequence is advanced. Defaults to 1. Higher numbers make the sequence appear to be playing back faster.

#### Mode > This Layer > Playback Settings > Playback Mode

Playback Mode determines the basic method of advancing frames for the sequence on this layer.

#### Mode > This Layer > Playback Settings > Playback Mode > Normal

The default. Frames will be advanced forward. After last frame in sequence, will return to beginning of sequence.

#### Mode > This Layer > Playback Settings > Playback Mode > Reverse

Frames will advance in reverse order. After first frame in sequence, will return to end of sequence.

#### Mode > This Layer > Playback Settings > Playback Mode > Random

Random frame chosen each time.

#### Mode > This Layer > Playback Settings > Playback Mode > Loop Repeat

Marked section will play in a loop. Loop start and end points are created by pressing **\[** for start loop point and **\]** for end loop point. Press **\=** to clear loop points for this layer. If no loop points are set, beginning and end of sequence will be treated as start and end points.

#### Mode > This Layer > Playback Settings > Playback Mode > Loop Bounce

As above, but instead of repeating, the playback direction reverses at each end of the loop.

#### Mode > This Layer > Playback Settings > Playback Pattern

The Playback Pattern only affects playback when in **Normal** playback mode. This field takes comma-separated integers specifying how many frames to advance (and in which direction) each time the frame advances. For instance, entering a pattern like this

````
1,1,1,1,-1,-1,-1
````

will play back in this sequence: Forward 1 frame, Forward 1 frame, Forward 1 frame, Forward 1 frame, Backward 1 frame, Backward 1 frame, Backward 1 frame. When following this pattern, the effect will be a sort of "loopy" cycle back and forth, but slowly shifting forward.

#### Mode > This Layer > Effects >

All of the Effects can take either a single integer or a comma-separated series. If there are a series of values, the next value for that particular effect will be set when the sequence advances.

#### Mode > This Layer > Effects > Zoom

Each layer is automatically scaled up to fit in the available window based on the frame dimensions. Zoom defaults to 100 (100%) - can be set to any value from 1 up.

#### Mode > This Layer > Effects > Opacity

Opacity defaults to 100 (100%) - can be set to any value from 0 up.

#### Mode > This Layer > Effects > Shift-X

Amount to shift layer horizontally, from -100 (outside window to the left) to 0 (default - center of window) to 100 (outside window to the right).

#### Mode > This Layer > Effects > Shift-Y

Amount to shift layer horizontally, from -100 (outside window to the top) to 0 (default - center of window) to 100 (outside window to the bottom).

#### Mode > This Layer > Effects > Flash

Defaults to 1. Takes a series of one or more 1s or 0s such that where there is a 1 the layer will be visible, where there is a 0, the layer will be invisible. This effect can be applied in combination with more complicated opacity changes. For instance, a sequence like this

````
1,1,1,1,1,1,1,1,1,1,1,0,0
````
will have the effect of intermittently flashing a glimpse of layers below the current one.

#### Mode > This Layer > Effects > Orientation >

This effect does not take multiple values. Select an option (all are self-evident): **Normal, Flip X, Flip Y, Flip Both**

#### Mode > This Layer > Special Effects >

The special effects create copies of the current layer to create these effects. These layers are then marked internally as "linked" to the current layer. If a new special effect is applied, all the linked layers will be first removed. The special effect can also be removed by going to **Mode > Layer Control > Delete Current Linked Layers**.

#### Mode > This Layer > Special Effects > Transreflect Horizontal

Mirrors the current layer horizontally and applies 50% opacity to the second layer so the two layers blend.

#### Mode > This Layer > Special Effects > Transreflect Vertical

Mirrors the current layer Vertically and applies 50% opacity to the second layer so the two layers blend.

#### Mode > This Layer > Special Effects > Transreflect Horiz and Vert

Mirrors the current layer Vertically and Horizontally and balances opacity on linked layers so all blend.

#### Mode > This Layer > Special Effects > Trails (#, Distance)

Takes two integer values separated by a comma, one for number, one for distance. This creates duplicate copies of the current layer, distance then determines how much each new linked layer will be advanced, creating a kind of ghosting "trails" effect.

Then all linked layers have their opacities balanced to blend.

Note that this special effect works best applied after other changes. If you have this special effect applied and then change sequence for instance, the special effect can be disrupted and should be reapplied.

#### Mode > Layer Control > Delete Current Layer

Self-evident.

#### Mode > Layer Control > Delete Current Linked Layers

Deletes all linked layers in the group of current layer - but retains the original layer. Basically, this removes any Special Effects applied as described above.

#### Mode > Layer Control > Insert Blank Layer Above Current

Inserts blank layer above current and selects that layer so you are immediately ready to assign sequence to that layer, etc.

#### Mode > Layer Control > Insert Blank Layer Below Current

Inserts blank layer below current and selects that layer so you are immediately ready to assign sequence to that layer, etc.

#### Mode > Global >

All controls not related to layers directly are within Global.

#### Mode > Global > Reset

Reset all to basic state - one layer with no sequence chosen, all playback normal, etc.

#### Mode > Global > States >

A 'State' is the current state of the layers. The layers and their properties are stored in the state, but the beat is not saved.

#### Mode > Global > States > Save State

Enter name for current state to be able to recall it later.

#### Mode > Global > States > Load State

Load previously saved state. Note that when a state is loaded, the current state is by default saved "to one side" so when the loaded state is unloaded, the previous state is returned to.

#### Mode > Global > States > Unload State

Unload currently loaded state and restore previous state

#### Mode > Global > States > New State Sequence

A state sequence is a sequence of states (really). The idea here is that you can build a number of states, potentially changing each a bit and saving as a new state so there is a natural transition, or just storing a number of unrelated states, then you can put them together into a sequence which can be stepped through in rhythm to the beat or can be manually advanced.

To create a new state sequence, just input any name and press Enter. After creating, you have an empty state sequence. In order to add states to it, you need to initiate it by choosing **Play State Sequence Loop** (see below). When this state sequence is playing, you will be able to select options to add states to it (see below).

#### Mode > Global > States > Set State Sequence Rate

This is the rate the state sequence will be stepped through. The field takes an integer. 1 is the fastest, to advance to next state each cycle. 2 is half that speed, and so on. Default is 24.

#### Mode > Global > States > Play State Sequence Once >

Choose from your previously saved state sequences. This will play the selected state sequence through once, and then restore the previous state of your layers.

#### Mode > Global > States > Play State Sequence Loop >

This will play through the selected state sequence and loop infinitely (until either **Unload State** or **Reset** is executed). This is the option that should be selected if you are working on adding states to an existing state sequence. Note that when you add a state, it will be added to the end (not in the position of the currently loaded state).

#### Mode > Global > States > Play State Sequence Manual Advance >

This option plays the state sequence selected, but will only advance to the next state in the sequence when space bar is pressed.

#### Mode > Global > States > Add State to Currently Selected Sequence >

Select a state to add to the currently playing state sequence. Note that it will be added to the end (not in the position of the currently loaded state).

#### Mode > Global > Export

Used to export all saved states, sequences, state sequences, and key shortcuts. This will pop up a textarea with selected text. Copy using ctrl-C/command-C on most platforms, then open saved.js file in a text editor, replace contents with pasted text and save the file. Next time you open the Slide Machine this file will be read from and used to preserve all of your saved data. 

To hide the export textarea, click on it.









