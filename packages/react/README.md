# @material-web/react

Accessible [Material 3](https://m3.material.io) components for React, styled with [Tailwind CSS](https://tailwindcss.com) v4. The components take the props, parts and providers of [React Aria Components](https://react-aria.adobe.com/), and come with the [`@material-web/tailwind`](https://github.com/material-web-io/monorepo/tree/main/packages/tailwind#readme) theme.

> **Beta.** This library is in beta. Its API may change between releases until the first stable version.

## Installation

The library needs React 19 and Tailwind CSS v4 in your project. To add Tailwind, follow its [installation guide](https://tailwindcss.com/docs/installation).

```sh
npm install @material-web/react
```

The theme, `@material-web/tailwind`, is installed with it. Import the library's stylesheet after Tailwind's. It adds the theme, the components' styles and the state variants to your build, and needs no [`@source`](https://tailwindcss.com/docs/detecting-classes-in-source-files#explicitly-registering-sources).

```css
@import 'tailwindcss';
@import '@material-web/react';
```

Import Roboto and Material Symbols Outlined from Google Fonts at the top of your CSS, above any other import:

```css
@import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200');
```

The library does not set the color or the typeface of the page. Add the page's color roles, its typeface and its type style to the `body`:

```html
<body class="bg-surface font-plain text-body-lg text-on-surface"></body>
```

## Usage

Import the components you need. Each component is a module of its own, so your bundler leaves out the ones you do not import. The package is ESM only.

```tsx
import { Button, Icon } from '@material-web/react'

export function SaveButton({ onSave }: { onSave: () => void }) {
  return (
    <Button variant="tonal" onPress={onSave}>
      <Icon name="save" />
      Save
    </Button>
  )
}
```

Style around the components with the theme's classes, next to Tailwind's own. A class passed in `className` replaces the component's own class for the same property: `bg-tertiary` replaces a filled button's `bg-primary`.

## Components

| Group               | Components                                                                                                                                                   |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Buttons             | Button, Button group, FAB, FAB menu, Icon button, Split button                                                                                               |
| Date & time pickers | Calendar, Date field, Date picker, Time picker                                                                                                               |
| Loading & progress  | Loading indicator, Progress indicator                                                                                                                        |
| Navigation          | Navigation bar, Navigation rail                                                                                                                              |
| Sheets              | Bottom sheet, Side sheet                                                                                                                                     |
| Other components    | App bar, Card, Checkbox, Chip, Dialog, Divider, Icon, List, Menu, Radio button, Ripple, Search, Slider, Snackbar, Switch, Tabs, Text field, Toolbar, Tooltip |

## React Aria

Pass [React Aria](https://react-aria.adobe.com/)'s props to a component next to its Material 3 ones, such as `onPress` in place of `onClick` and `isDisabled` in place of `disabled`:

```tsx
<Button variant="tonal" isDisabled={!canSave} onPress={save}>
  Save
</Button>
```

Import the components from `@material-web/react`, and the parts React Aria already provides from `react-aria-components`:

| Import                                                      | Use                                                  |
| ----------------------------------------------------------- | ---------------------------------------------------- |
| `Text`, `Heading`, `Label`, `Keyboard`, `Header`            | The text of a component, each in its slot            |
| `MenuTrigger`, `SubmenuTrigger`, `MenuSection`, `Separator` | The trigger, the sections and the dividers of a menu |
| `Input`, `Autocomplete`                                     | The input of a search field, and filtering a list    |
| `Form`, `FieldError`                                        | A form, and the error message of a field             |
| `RouterProvider`, `I18nProvider`                            | The app's router and locale                          |

- **Routing:** Give a `ListItem`, `MenuItem`, `FabMenuItem` or `Tab` an `href`, and wrap the app in `RouterProvider` to send its links through your router. See React Aria's [Framework setup](https://react-aria.adobe.com/frameworks).
- **Locale:** The locale is the browser's by default. Wrap the app in an [`I18nProvider`](https://react-aria.adobe.com/I18nProvider) to set another.
- **Dates:** Pass a date or a time as an object from `@internationalized/date`, such as a [`CalendarDate`](https://react-aria.adobe.com/internationalized/date/CalendarDate) or a `Time`.
- **Package managers:** npm installs `react-aria-components` and `@internationalized/date` with the library. With a package manager that keeps a project from importing the dependencies of its dependencies, such as pnpm, add them to your project as well.

## Composition

Write a component's content as its children, in place of `icon`, `title` or `actions` props. When a component has several places for its content, set the `slot` prop on each child to choose its place, as with React Aria's [slots](https://react-aria.adobe.com/styling#slots):

```tsx
import { Icon, IconButton, List, ListItem } from '@material-web/react'
import { Text } from 'react-aria-components'

export function Contacts() {
  return (
    <List aria-label="Contacts">
      <ListItem id="ada" textValue="Ada Lovelace">
        <Icon slot="leading" name="person" />
        <Text slot="label">Ada Lovelace</Text>
        <Text slot="description">Mathematician</Text>
        <IconButton slot="trailing" aria-label="Call Ada Lovelace">
          <Icon name="call" />
        </IconButton>
      </ListItem>
    </List>
  )
}
```

Pass a function as children to render content from the component's state, as with React Aria's [render props](https://react-aria.adobe.com/styling#render-props):

```tsx
<IconButton aria-label="Favorite" isSelectable isSelected={isFavorite} onChange={setFavorite}>
  {({ isSelected, isHovered }) => (
    <Icon name="favorite" className={isSelected || isHovered ? 'icon-filled' : undefined} />
  )}
</IconButton>
```

## States

A component reports its states, such as hovered, pressed or selected. Style a state with a Tailwind variant, with a function passed as `className` or `style`, or with a data attribute in your own CSS:

| State                     | Variant          | Function         | Attribute            |
| ------------------------- | ---------------- | ---------------- | -------------------- |
| Hovered                   | `hover:`         | `isHovered`      | `data-hovered`       |
| Pressed                   | `pressed:`       | `isPressed`      | `data-pressed`       |
| Focused from the keyboard | `focus-visible:` | `isFocusVisible` | `data-focus-visible` |
| Selected                  | `selected:`      | `isSelected`     | `data-selected`      |
| Disabled                  | `disabled:`      | `isDisabled`     | `data-disabled`      |

The variants are those of React Aria's [Tailwind plugin](https://react-aria.adobe.com/styling#plugin), which the stylesheet loads. On a component, use `pressed:`, `selected:` and `not-disabled:` in place of Tailwind's `active:`, `checked:` and `enabled:`.

## Icons

`Icon` shows a [Material Symbols](https://fonts.google.com/icons) icon by its ligature name. Set its size with `icon-` and a number of dp, such as `icon-24`:

```tsx
<Icon name="home" className="icon-32" />
```

A component sizes the `Icon` it holds. Any other icon works as a child too, such as one from an SVG icon library, given the same size:

```tsx
<Button>
  <Plus className="size-5" />
  Create
</Button>
```

## Theming

The colors, typefaces, shapes and motion come from the theme. Set `data-theme="dark"` or `data-contrast="high"` on the root element or on any part of the page, and generate the colors of your own seed color. See the [theme's readme](https://github.com/material-web-io/monorepo/tree/main/packages/tailwind#theming).

## License

[MIT](LICENSE). Material Design is a trademark of Google LLC; this project is independent and not affiliated with or endorsed by Google.
