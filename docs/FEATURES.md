# Product tour

A walk through every screen of Collectify.

- [Home](#home)
- [Collections](#collections)
- [Profiles and people](#profiles-and-people)
- [Messages and notifications](#messages-and-notifications)
- [Settings and themes](#settings-and-themes)
- [Authentication and onboarding](#authentication-and-onboarding)
- [Moderation](#moderation)
- [Mobile](#mobile)

---

## Home

### For you

The default feed. Collections are ranked in SQL from what you like, save and open, the tags and
categories behind them, the people you follow, popularity and freshness. Collections you have ever
liked or saved never come back. The ranking is described in
[Architecture → Recommendations](ARCHITECTURE.md#recommendations).

![For you feed](screenshots/home-for-you.png)

### Explore

Every public collection with a category menu, tag filter, full-text search and sorting. The whole
state lives in the URL, so any view can be shared or bookmarked.

![Explore feed](screenshots/home-explore.png)

### Boards

Saved collections can be grouped into boards. Each board becomes a tab on the home page with its
own "more like this" feed. Tabs can be reordered.

![Board feed](screenshots/home-board.png)

### Search

The navbar search finds people by username as you type.

![User search](screenshots/search.png)

---

## Collections

### Collection page

A cover, category, description, tags, likes, saves and the author. The `⋯` menu holds editing,
statistics and deletion.

![Collection page](screenshots/collection.png)

### Items

Items are laid out in a Pinterest-style masonry grid. Each card has one of four sizes
(**S**, **M**, **L**, **XL**) and can be dragged to reorder. An item needs a title or an image and
may carry a description and a source link.

![Masonry grid](screenshots/collection-items.png)

### Item viewer

Opens any item full-screen, with previous / next navigation from the keyboard.

![Item viewer](screenshots/item-viewer.png)

### Comments

Threaded comments (one level of replies), `@mentions` of who a reply answers, `(edited)` marks and
a heart from the collection author.

![Comments](screenshots/comments.png)

### Creating and managing collections

A two-step wizard creates the collection, then its first item. _My collections_ lists everything
you own with visibility, category and tag filters.

| Create                                                 | My collections                                   |
| ------------------------------------------------------ | ------------------------------------------------ |
| ![Create collection](screenshots/create-collection.png) | ![My collections](screenshots/my-collections.png) |

---

## Profiles and people

### Your profile

Banner, avatar, bio, location and stats, with _Created_, _Saved_ (all saves and every board) and
_Private_ tabs.

| Created                                   | Saved and boards                             |
| ----------------------------------------- | -------------------------------------------- |
| ![Profile](screenshots/profile.png)       | ![Saved](screenshots/profile-saved.png)      |

### Other people

Follow, message or report any user. Verified accounts carry a badge.

![User profile](screenshots/user-profile.png)

### Followers and suggestions

Followers and following lists, plus _People you may know_ — friends of friends, people from your
city and your followers you do not follow back.

| Followers                                 | People you may know                                           |
| ----------------------------------------- | ------------------------------------------------------------- |
| ![Followers](screenshots/followers.png)   | ![People you may know](screenshots/people-you-may-know.png)   |

---

## Messages and notifications

### Chats

Realtime direct messages with unread counters, _Seen_ receipts, online presence and per-chat mute.

![Chats](screenshots/chats.png)

### Notifications

Follows, likes, saves, comments, replies, author hearts, report outcomes and sanctions — grouped by
day, with an unread filter. New notifications also pop up live anywhere in the app. Undoing an
action (unfollow, unlike) retracts its notification.

![Notifications](screenshots/notifications.png)

---

## Settings and themes

Profile, password, interests and the theme gallery.

![Settings](screenshots/settings.png)

Collectify ships **45 themes** in the spirit of monkeytype. Every color in the UI is a token from
[`app/themes.css`](../app/themes.css), so a theme is a single block of CSS variables.

| Dark                                      | Dracula                                         |
| ----------------------------------------- | ----------------------------------------------- |
| ![Dark](screenshots/theme-dark.png)       | ![Dracula](screenshots/theme-dracula.png)       |
| **Nord**                                  | **Serika Dark**                                 |
| ![Nord](screenshots/theme-nord.png)       | ![Serika Dark](screenshots/theme-serika-dark.png) |
| **Rosé Pine Dawn**                        | **Tokyo Night**                                 |
| ![Rosé Pine Dawn](screenshots/theme-rose-pine-dawn.png) | ![Tokyo Night](screenshots/theme-tokyo-night.png) |

---

## Authentication and onboarding

Email and password or GitHub / Google OAuth. After sign-up, new users pick the categories they are
into; the covers are random popular collections of each category.

| Login                                | Register                                   |
| ------------------------------------ | ------------------------------------------ |
| ![Login](screenshots/login.png)      | ![Register](screenshots/register.png)      |

![Onboarding](screenshots/onboarding.png)

---

## Moderation

Available to moderators and admins at `/management`.

### Users

Search any account, review activity, apply or revoke sanctions (account ban, comments mute,
messenger mute), manage roles and impersonate for support.

![Management — users](screenshots/management-users.png)

### Reports

A FIFO queue of open reports with an evidence snapshot, the reporter's and target's history and
active sanctions. A verdict closes duplicates together and never weakens a stronger sanction.

![Management — reports](screenshots/management-reports.png)

### Categories and tags

Admins create, reorder and archive categories and remove spam tags.

![Management — categories](screenshots/management-categories.png)

---

## Mobile

Every screen is responsive.

<p align="center">
  <img src="screenshots/mobile-home.png" width="30%" alt="Mobile — explore" />
  &nbsp;
  <img src="screenshots/mobile-collection.png" width="30%" alt="Mobile — collection" />
  &nbsp;
  <img src="screenshots/mobile-chat.png" width="30%" alt="Mobile — chat" />
</p>
