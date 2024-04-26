<h1 align="center">
  
  
![BatteryMageCoverResized](https://github.com/kkcmah/Battery-Mage/assets/16821647/2854c2ed-097e-4bc3-985b-964ed0af029d)
<br>
  Battery Mage
  <br>
</h1>

## About

The game can be played on itch.io: https://mortalmememagician.itch.io/battery-mage

or here on github: https://kkcmah.github.io/Battery-Mage/

My submission to Gamedev.js Jam 2024:

Someone has drained all the power from the lands. It is up to you, The Battery Mage, to power up in order to disrupt the current balance of power, and re-power the land.

Note: you may feel a lag when you first load into the game. 

Controls

Mouse - look around and aim

Left mouse button - use weapon

WASD and/or ZQSD to move

Spacebar - jump

1, 2, 3  - swap weapons once unlocked

7 - drink potion

m - mute game

-------------------------------------------------------------

This is a 3D ARPG game built using Enable3D (https://enable3d.io/), as a 3D extension for Phaser (https://phaser.io/). Bullet physics, and Three.js are running under the hood to create this 3D experience.

The template file that I used for this project is from: https://github.com/enable3d/enable3d-phaser-project-template

All assets made by me within the jam time frame using Blender and Paint

Audio are CC0 licensed from https://freesound.org/ and cut in Audacity

Details of audio attribution can be found in src/assets/audio/audioAttributions where I've listed links to the original audio sources

## Background

I have been learning 3D Blender for the past 4 months and have been gaming for 20+ years. My favourite programming language is JavaScript and I had always wanted to try making games. I figured, I may as well apply my skills to attempt to complete a game for a game jam. The deadline imposed by game jams should force me to actually complete a project. Surely, my many years of experience as a game end user would translate to being able to develop great games... right? This is my second non tutorial Phaser game and first somewhat presentable game.

## Game TODOs But Will Probably Carry This Knowledge Over to Future Games

- The environment is a bit barren, but adding extra assets would cause pc fans to go wrrrrrr even more than they already are due to the ground already being made up of 900 physics objects constantly checking collisions. On that note, I looked into creating instanced meshes or using shaders to replace these objects while keeping the changing colours feature, but wasn't able to figure things out. I will make environments out of less objects going forwards.
- More flashier effects and animations
- Interactable npcs, quests, and achievements
- Better enemies in all aspects (ai, design, fights)
- Code is a bit messy, but halfway through this project I came up with a way of separating components that works for me. The initial half needs much refactoring (*cough* player class)
- Different scenes to split up the game world
- A game start, and settings UI

## Learnings

- Creating animations in the Blender action editor and how to export models in .glb format then loading the model using Three.js and playing the animation
- Phaser: GameObjects, Tweens, and loading assets
- Programming a bit in 3D with the help of Enable3D, Three.js, ammo.js, and Bullet physics
- Improved understanding of raycasting, points in 3D, physics, and collisions

## Running Local Development

```console
# Clone this repository

# Go into the repository

# Install dependencies
$ npm install

# Start the local development server (on port 8080)
$ npm start

# Ready for production?
# Build the production ready code to the /dist folder
$ npm run build
```

To deploy game to github do `npm run build` then copy files from /dist to /docs

Then setup GitHub pages to build the /docs folder from whatever branch you put it in

## JavaScript

You want to use JavaScript instead of TypeScript?

- Add `"checkJs": false,` to [tsconfig.json](./tsconfig.json)
- Change the extension of all game files in [/src/scripts](./src/scripts) from `.ts` to `.js` (except `game.ts`).
