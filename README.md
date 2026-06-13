# Nusantara Realm

A 3D, open-world **monster-taming RPG** built with **React-three-fiber**, reusing the
art and creatures from the 2D *Nusantara Monster* game. It blends three influences:

- **Pokémon-style taming** — wander the world, find wild monsters, win them over.
- **Monster Rancher-style raising** — bond, level, and care for your tamed roster.
- **Fable-style open world** — a continuous 3D realm you explore freely.

## HD-2D approach

Rather than modelling every creature in 3D, the existing hand-drawn 2D sprites are
planted in a true 3D world as camera-facing **billboards** (the "HD-2D" look, à la
*Octopath Traveler*). The ground, lighting, fog, and camera are fully 3D; the art
stays 2D. This lets the whole existing Nusantara catalogue come along for free.

## Controls

- **WASD / arrow keys** — walk
- **Drag** — orbit the camera
- **E** — tame the nearby wild monster
- **Party** button (top-right) — view your tamed monsters

## Run it

```bash
pnpm install
pnpm dev
```

## Stack

- React 18 + `@react-three/fiber` + `@react-three/drei`
- `three`
- `zustand` for game state
- Vite + TypeScript

## Status

Early but playable v0: explore, approach wild monsters, and tame them into your party.
Roadmap: turn-based battles (the 2D game's attack/hit frames are already shipped as
assets), a ranch/bonding loop, monster evolution stages, and elemental type matchups.
