Welcome to my Minesweeper!

## Introduction

I wanted to experiment with frameworks like [Next.js](https://nextjs.org/), [tailwindcss](https://tailwindcss.com/) and [Django](https://www.djangoproject.com/).

The game is pretty simple. I focused on making it smooth and easy to use.

Here are some of the more interesting files:

* servers/models.py - the core backend data
* ui/src/store.ts - the frontend logic for updates
* server/views.py - the main logic for updating the games
* server/api.py - generating unique games
* ui/src/app/world/tile.tsx - individual cells used to play the game

There is so much more I would like to learn and do! Check out the different `TODO` comments for examples. Any labelled (scope) or (refactor) highlight changes I would like to make.

## Running the code

First, run the backend:

```bash
pip install pipenv
pipenv install
pipenv shell
./manage.py migrate
./manage.py runserver
```

In a second terminal, run the frontend:

```bash
cd ui
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
