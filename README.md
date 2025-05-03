# Rosie AI

A simple Electron application built with React and TypeScript that provides an interface for interacting with Rosie AI, a chatgpt-based agent that has access to running commands, searching for files, etc.

The goal of the project is to build an agent and give it access to as much control of the system as possible. Thus, using this agent is only adviced for people who know what they are doing.

This is a part of a personal challenge to create and release something new every week, no matter its state. 

![image](https://github.com/user-attachments/assets/a81d6c76-088f-40dd-8e29-95df7df1de79)

## Features
- Run commands ("what version of node am I using?") - will display command and ask for confirmation before running
- Set memories ("my name is Alex, please remember it")
- Search files using [Everything CLI](https://www.voidtools.com/) ("Find the exe location of elden ring on my PC")

## Prerequisites

- Node.js (>= 14.x)
- npm (>= 6.x)
- OpenAI API Key (for ChatGPT integration)

## Getting Started

1. Clone this repository
2. Install dependencies:
   ```
   npm install
   ```
3. Copy .env.template into .env and add your env variables.

4. Run the application in development mode:
   ```
   npm run dev
   ```

## Project Structure

- `src/main` - Electron main process code
- `src/renderer` - React application (renderer process)
- `src/types` - TypeScript type definitions
- `src/config.ts` - Application configuration including ChatGPT settings

## Developing
Good luck, this was made hastingly with cursor and no CI/CD in mind.

## Building the app
No can't do. There is a setup to build with electron forge, but something breaks with including the renderer.

## License

MIT
