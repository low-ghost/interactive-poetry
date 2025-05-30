export const MOON_TITLE = 'Shrine of Footprints';

export const POEM = `The moon
some nights
is a moth no
one sees. Powder
feather whisper
light, not so
much present
as presence.
When a fire
takes a factory
with the workers
locked inside
which causes
a deep cut into
the profits
of the owners
who go otherwise
unpunished, the moon
shines for those whom
our grief can never
save. Shrine of footprints.
Shrine of smoke.
It seems
I have called you
the moon, and I
hope our friendship
survives it. Someone
said the word trespass
and I thought
of how whether
you like it or not
people are going
to see more than
a sliver of you crossing
unauthorized territory.
Wear your best things.
How better to shine good
light on our ghosts?`;

export const POEM_WORDS = POEM.split(/\s+/).filter(
  (word) => word.trim().length > 0,
);

export const POEM_LINES = POEM.split('\n');

// Key phrases for visual emphasis
export const KEY_PHRASES = [
  'moth no one sees',
  'Powder feather whisper',
  'fire takes a factory',
  'workers locked inside',
  'Shrine of footprints',
  'Shrine of smoke',
  'unauthorized territory',
  'Wear your best things',
  'shine good light on our ghosts',
];

// Animation states
export const ANIMATION_STATES = {
  MOTH: 'moth',
  FACTORY: 'factory',
  SHRINE: 'shrine',
  TRESPASS: 'trespass',
  GHOSTS: 'ghosts',
} as const;
