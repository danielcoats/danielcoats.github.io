# danielcoats.nz

Personal website built with Jekyll and deployed with GitHub Pages.

## Requirements

- Ruby `3.3.4`
- Bundler
- Jekyll dependencies from `Gemfile.lock`

The repo includes `.ruby-version`, so `rbenv` will select the correct Ruby version automatically.

## Setup

```bash
brew install rbenv ruby-build
rbenv install 3.3.4
gem install bundler
rbenv exec bundle install
```

## Run Locally

Build the site:

```bash
rbenv exec bundle exec jekyll build
```

Start the local server:

```bash
rbenv exec bundle exec jekyll serve
```

Open `http://127.0.0.1:4000/`.

For live reload:

```bash
rbenv exec bundle exec jekyll serve --livereload
```
