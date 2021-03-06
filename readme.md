# TSK

TSK PL (Programming language) is superset of JavaScript, adds some syntaxic functionality to existing JavaScript.
TSK Complier transplies tsk code into valid JavaScript code and is written in TypeScript.
This PL is meant to be compiled relatively fast compared to TypeScript and CoffeeScript PLs and 
it's bundled compiler to be small (archived by various ways).

## Installing
1. Download and install [Git](https://git-scm.com/downloads) (Skip if already installed).
2. Download and install [Node](https://nodejs.org/en/download/current/) (Skip if already installed).
3. Download this git repository using `git clone https://github.com/MadProbe/tsk` command.
4. Go to downloaded code typically using `cd tsk`.
5. Install dependencies by running `npm install --legacy-peer-deps` (`npm i --legacy-peer-deps` does same)
6. Build project using `npm run build`.
7. To install compiler write `npm run globalinstall`.
8. Also recommend to install node-fetch as global module by using `npm i -g node-fetch` command, by that allowing compiler fetching tsk scripts from web.

## Build
Build project using `npm run build`.

## Usage
> `tskc --main=path/to/file --out=path/to/out/dir --pretty`
* main - main file to start compilation from (can be passed multiple times if you need to compile several files at one time)
* out - dir where output code is stored
* pretty - If output must be prettified

## Contacts
[Discord](https://discord.gg/5dPuBvZjjx)
