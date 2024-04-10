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

My top priories would be:

* Making the "clearing" smoother to ensure it does not block user interactions
* Change serving pages so the routes could be /world/cool-unique-slug instead of /world?slug=okay-i-guess

## Running the code

The easiest way to run the application us using `docker compose up`.

You can also run it outside of docker with Node 18 and Python 3.11.

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
