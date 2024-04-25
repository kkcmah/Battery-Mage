<h1 align="center">
  <br>
  Battery Mage
  <br>
  ![BatteryMageCover](https://github.com/kkcmah/Battery-Mage/assets/16821647/83306959-3fbe-4ca8-b5d8-39a06d7838db)

</h1>

## About

This game can also be played here on github: https://kkcmah.github.io/Battery-Mage/

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

Details of audio attribution can be found in src/assets/audio where I've listed links to the original audio sources

This project started from an Enable3D template at: https://github.com/enable3d/enable3d-phaser-project-template

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

## JavaScript

You want to use JavaScript instead of TypeScript?

- Add `"checkJs": false,` to [tsconfig.json](./tsconfig.json)
- Change the extension of all game files in [/src/scripts](./src/scripts) from `.ts` to `.js` (except `game.ts`).
