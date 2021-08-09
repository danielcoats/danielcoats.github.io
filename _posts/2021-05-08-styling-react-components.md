---
layout: post
title: 'Styling React Components'
---

SASS, CSS Modules, custom properties, utility classes... all of these tools solve some problem with CSS, and each has its advocates. But when you have a React component in need of some style, which tool should you reach for? Even for [a small project]({% post_url 2021-04-11-running-training-planner-the-idea %}), you don't want to experience decision fatigue every time you need to write some CSS. And ideally, you want a tool, or set of tools, that encourage consistency, especially with regards to colors, sizing, and other common styling concerns.

Here's the solution I ended up with. It is by no means perfect, but hopefully it achieves the objectives above.

## Importing Bootstrap CSS

I'm using Bootstrap, so at a minimum, I need to include the bootstrap styles. Since I'm using `create-react-app` which includes `sass-loader` by default, I followed the [Bootstrap optimization](https://getbootstrap.com/docs/5.0/customize/optimize/) advice, and I commented out the styles for components that I'm not using yet, such as carousels and modals, in a file called `bootstrap.scss`. I then imported this in `global.scss` which is imported in the top-level `index.js` file so that it is available globally (more on that later).

A snippet of `bootstrap.scss`:

```scss
// --------------------------------------------------
// Import Bootstrap
// Unused files commented to reduce the amount of CSS
// --------------------------------------------------

// Configuration
@import '~bootstrap/scss/functions';
@import '~bootstrap/scss/variables';
@import '~bootstrap/scss/mixins';

// Layout & components
@import '~bootstrap/scss/root';
@import '~bootstrap/scss/reboot';
// @import '~bootstrap/scss/toasts';
// @import '~bootstrap/scss/modal';
...
```

## Adding component styles

You might think we're done with CSS now. While the Bootstrap components are a great start, we still need somewhere to write component-specific styles. Bootstrap provides some built-in utility classes for padding, margins, sizing, etc. but these only cover a subset of CSS properties, so at some point it is necessary to actually write some CSS.

React encourages writing CSS at a component level to keep things modular and have the CSS close to where it is being used. But if all CSS styles are scoped to a single component, it is harder to keep CSS consistent between components. Ideally, I want to use the variables already defined in Bootstrap - but I don't want to have to `@import '~/bootstrap/_variables.scss'` in every component, which creates duplication, and I may want to override some of these variables.

What about CSS custom properties? These are native to the browser, so presumably have good performance. They can be easily tweaked in dev tools for rapid iteration. And they can be defined once at the top-level and used everywhere - no imports required. But, as of v4.6.x, Bootstrap only defines [a tiny subset](https://getbootstrap.com/docs/4.6/getting-started/theming/#css-variables) of its SASS variables as custom properties. It sounds like there are [plans to improve coverage](https://github.com/twbs/bootstrap/issues/26596#issuecomment-742799995) in future, but this didn't make the cut for v5, and my project is using v4.6.

## Bringing it all together

So this is where I am: I want to write some custom (S)CSS at the component level, but as much as possible, I want to re-use the styles already defined in Bootstrap, so that (a) there is consistency between components and (b) I can make changes to common styles in one place, and have it reflected anywhere that style is used. My solution extends upon Bootstrap's approach. 

I created a file called `global.scss` and imported it in the root level `index.js`. This file does a few things:

- Imports custom SASS variables from `theme.scss` that override some of the Bootstrap variables
- Imports all of the required Bootstrap styles
- Exports any commonly used variables as custom properties defined on `:root`

Whenever I find myself reaching for a color, size, or other common property, I add it in here first, so I can use it in any components that might need that property. This way, I get the power of SASS, with the usability of custom properties. Here is `global.scss`:

```scss
// Override default variables before importing Bootstrap
@import 'theme.scss';

// Import Bootstrap
@import 'bootstrap.scss';

// Define custom properties
:root {
  @each $shade, $value in $grays {
    --gray-#{$shade}: #{$value};
  }

  --border-radius: #{$border-radius};

  @each $size, $length in $spacers {
    --spacing-#{$size}: #{$length};
  }
}
```

Each component has its own CSS file with the `\*.module` extension to indicate that it is a [CSS Module](https://create-react-app.dev/docs/adding-a-css-modules-stylesheet/) and should be locally-scoped. For example, if I were writing a Button component, I would import `Button.module.scss` into my `Button.js` component like so:

```js
import styles from './button.module.scss';`
```

`button.module.scss`:

```scss
.default {
    background-color: var(--gray-200);
    color: var(--gray-600);
}
```

I can reference this in my component using `className={styles.default}`. At compile time, the CSS above is transformed into the following, with a prefix and hash to prevent class name conflicts:

```css
.button_default__KKOfe {
    background-color: var(--light);
    border-radius: var(--border-radius);
    font-size: smaller;
    margin-top: auto;
}
```

## What about Tailwind CSS?

A few hours in, I briefly considered throwing it all out and starting over with [Tailwind](https://tailwindcss.com/), a CSS framework in which all styles are defined using utility classes. It seemed attractive for rapid iteration, as the styles are located with the component markup, and there is no need to think about the cascading nature of CSS.

But there were two major factors which put me off. First, the obvious one, is that it can lead to a lot of duplication, making it harder to refactor styles down the road. And second, Tailwind doesn't provide any components like Bootstrap. And I didn't feel compelled to implement my own dropdown from scratch. [Tailwind UI](https://tailwindui.com/) appears to solve this problem, but it is costly for a small side project like this.

For this project, Bootstrap was the most pragmatic path, but I hope to revisit Tailwind in a future project, or maybe even [use them together](https://www.scottbrady91.com/General/Adding-Tailwind-Utility-Classes-to-your-Bootstrap-Website).

As with front-end web development in general, the CSS landscape is always changing, with new technologies bubbling up, only to be replaced by something entirely new. But for now, I have found an approach that works, and I can get back to building.
