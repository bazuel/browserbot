<p align="center">
  <a href="https://browserbot.io/" target="blank">
    <img src="https://browserbot.io/assets/img/hero-bot.png" width="200" alt="Nest Logo" />
  </a>
</p>

## Description

[Browserbot](https://browserbot.io/) API system documentation

## Introduction

Browserbot APIs are a suite of utilities that allow the developer to embed all the Browserbot functionalities on their
own projects, in particular allow to record sessions of events, visualize each event recorded, modify and re-run entire
sessions directly with the browserbot backend engine. Each event represent an info of an action in a session or an info
recorded automatically by the **Browserbot Monitor** regarding the DOM or the browser storage (local/session/cookie);
each of these events are fundamental to represent exactly the session to register.

## API List

### Download preview

_To download a preview of a list of events filtered by fields from a single session or multiple sessions_

* Type: `GET`
* Path: `/api/event/`
* Params:
    * `[filters]`: a list of filters for the events to download in a `key:value` format

### Download Session

_To download an entire session (an event list) with all information about actions and DOM changes, eventually filtered._

* Type: `GET`
* Path: `/api/event/session`
* Params:
    * `reference`: the session identifier
    * `[filters]`: an optional list of filters for the events to download in a `key:value` format

### Download Screenshot

_To download a dom-full event, it can be used like an interactive screenshot where (with the help of the camera
component) it's possible to visualize a snapshot of a web page where all the dom elements are enabled_

* Type: `GET`
* Path: `/api/event/screenshot`
* Params:
    * `reference`: the screenshot identifier

### Run Session

_To run a session using the Browserbot Runner System of a specific session_

* Type: `GET`
* Path: `/api/event/run`
* Params:
  * `reference`: the session identifier
