export const FOREST_TITLE = 'fəɹəst';

export const POEM = `as if to say
in the forest
and of it
planting
the trees
of my voice
my fingers
duplicating
every part
of me
finally as
beautiful
as breath
every
intersection
of body
alive with
meaning
and significance
lost
running through
branches
find me
where
I look`;

export const POEM_WORDS = POEM.split(/\s+/).filter(
  (word) => word.trim().length > 0,
);
export const POEM_LINES = POEM.split('\n');

export const ETYMOLOGY = `From Middle
English forest,
from Old French
forest, from
Early Medieval
Latin forestis,
likely from
Frankish *
forhist ("forest,
wooded country")
to Old English
fyrh(þe)
("forested
land"). Old High
German forst
("forest"), Old
Norse fýri-
("pine forest"),
in this sense
mostly displaced
the native
Middle English
word from Old
Englishwudu
("wood, forest,
wooded"), and
Middle English
weld, weald, from Old
English weald
("modern 'wold,
wild, weald'
from Proto-
Germanic *
walþuz ("forest
of trees"), from
Proto-Indo-European
*wal-tus
("forest,
wooded
country"), from
Proto-Germanic *
walþiz. *furrhō
("fir, pine").
from Proto-
Indo-European
*perkwu
("oak"),`;

export const ETYMOLOGY_LINES = ETYMOLOGY.split('\n');
