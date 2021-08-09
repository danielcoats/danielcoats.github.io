---
layout: post
title: 'Introducing Training Planner'
---

Back in April, I decided to [build an app]({% post_url 2021-04-11-running-training-planner-the-idea %}) to help me train for running events, now that in-person events are starting up again. About a month ago I entered Seattle's [Lake Union 10K](https://lakeunion10k.com). This gave me the motivation to finally finish up the app.

<a href="https://trainingplanner.danielcoats.nz/" target="_blank"><img src="/assets/images/training-planner/training-planner.png" alt="Screenshot of the Training Planner website"></a>

The goal was to make it easy to create a training plan, and track progress against the plan. Many fitness apps provide rich tracking for individual workouts, but few tools for planning or tracking a program which might span weeks or months. In my experience using it so far, Training Planner is an ideal companion to Strava, and an improvement on my previous approach of using a Word document.

I had to cut some of the features I originally planned. For now, your data is only stored locally in your web browser, so if you change browser or switch to a different computer, you'll have no way of accessing your training plans. I added a Download button and the ability to import the downloaded file, so there is at least a way of backing up and restoring a snapshot of your data.

I may write more about the technical design in future blog posts. But for now, here are some of the technologies I used:

- [Create React App](http://create-react-app.dev)
- [Redux Toolkit](https://redux-toolkit.js.org)
- [TypeScript](https://www.typescriptlang.org)
- [React Bootstrap](http://react-bootstrap.github.io)
- [Formik](https://formik.org)
- [Dexie](https://dexie.org)

Check it out at <a href="https://trainingplanner.danielcoats.nz/" target="_blank">trainingplanner.danielcoats.nz</a>. You can find the [source code on GitHub](https://github.com/danielcoats/training-planner).

I also discussed my approach to styling the React components in [a previous blog post]({% post_url 2021-05-08-styling-react-components %}). The app is deployed via GitHub Actions to Azure Static Web Apps.

If you have any feedback, [contact me](/contact) or [open an issue](https://github.com/danielcoats/training-planner/issues/new) on GitHub.
