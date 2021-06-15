![Xornet Logo](https://cdn.discordapp.com/attachments/806300597338767450/840561743804891166/unknown.png)

# Information
We are XORNET this is a fun little project started by @Geoxor for people who have servers and don’t have shit to do with them, our goal is to let people use our software to manage their servers!

Heres the discord server for you to join
https://discord.gg/geoxor

Figma:
https://www.figma.com/file/dURFohUnUHXzgO8lSd53jO/Xornet

# Installation 
Make sure you have Node.js v14+
  1. Client: 
     2. `npm i` to install dependancies
     3. `npm run serve` to run the client
     4. `npm run build` to compile the client
  2. Reporter: 
     1. `npm i` to install dependancies
     2. `nodemon .` or `node .`
     2. `npm run build.` to compile the reporter (binaries will go in the dist folder)
  3. Server:
     1. `npm i` to install dependancies
     2. `nodemon .` or `node .`

# Information for pull requests
Theres some scripts you should run before doing pull requests
  `npm run prettify` on each folder to fix the formatting so it matches the rest of the repo

# Reporter
The reporter is the main binary app that you can easily download and install on your VMs or servers, it takes care of reporting system information to https://xornet.cloud!

![Reporter](https://cdn.discordapp.com/attachments/806300597338767450/850248559760506940/unknown.png)

The compiled binaries work on the following operating systems:
  - Debian
  - Windows 10
  - Windows Server 2019
  - MacOS

The decompiled reporter can be ran using node.js at least on:
  - Debian
  - Ubuntu
  - Manjaro
  - Raspbian
  - Windows 10
  - Windows Server 2019
  - MacOS
  
# Disclaimer
We don't know how to code, if you don't like it, its your fault for not committing.
