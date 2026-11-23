How Will the Stranger Live? — Translation Kit
==============================================

This kit lets you translate the game into another language (or improve the
English translation) without touching the game's code.

Files
-----
  template.json   Every text in the game, with empty translations.
                  Start here to translate into a new language.
  en.json         The bundled English translation, in the same order and
                  categories as template.json. Use it as a reference, or edit
                  it to improve the English.
  README.txt      This file.


How to load a translation file into the game
--------------------------------------------
  1. Open the game. On the title screen, press the globe button (🌐) at the
     top, next to the version number and the language buttons.
  2. In the small window that opens, press "Load a translation file"
     (Japanese: 翻訳ファイルを読み込む).
  3. Choose your .json file. The page reloads in that language.

The loaded file is remembered by your browser, and appears in the language
list with a "*" after its name. To go back, press
"Remove the loaded translation" (Japanese: 読み込んだ翻訳を外す).

Anything you haven't translated yet simply stays in Japanese, so you can
translate a little at a time and check it in the game as you go.


Updating to a new version of the game
-------------------------------------
Files made for an older version still load, but texts that were added or
changed since then appear in Japanese. To move your work (finished or not)
onto the newest text list, open this page in your browser:

  https://chingin-dorei.github.io/ihoujin/translation/convert.html

  1. Choose your translation file. It stays in your browser; nothing is
     uploaded.
  2. Unchanged texts keep your translation. Where the Japanese was changed,
     the old and new texts are shown side by side, and you decide whether to
     use the old translation.
  3. Save the updated file. New texts are left empty for you to fill in.

You can stop halfway: texts you have not checked yet are kept in the saved
file under "_review", and translations that are no longer used under
"_removed". The game ignores both. Please do not delete the empty lines in
your file: they help the page tell new texts from changed ones.


File format
-----------
  {
    "code": "fr",
    "name": "Français",
    "fixes": [],
    "strings": {
      "Dialogue": { ... },
      ...
    }
  }

  code     Language code, e.g. "fr", "de", "zh-TW". "ja" cannot be used.
           If you use "en", your file replaces the bundled English.
  name     The name shown in the language list.
  version  The game version the text list comes from. The game ignores it.
  fixes    Optional. Search-and-replace rules applied after translating,
           as [regular expression, replacement] pairs. The English file uses
           these to fix grammar when a name is inserted, e.g.
           ["\\bYou's\\b", "Your"].
  strings  "Japanese text": "your translation" pairs.
           The keys (left side) must stay exactly as they are.
           Only change the right side. Leave a value as "" to keep Japanese.

Save the file as UTF-8.


Categories
----------
template.json and en.json group the texts into categories. The grouping is
only for your convenience; the game ignores it. You may also put everything
in one flat list.

  画面の部品                 UI parts: buttons, status bar, bag panel
  選択肢と説明               Choices (menu buttons) and their hints
  システムメッセージ         System messages: dice checks, items gained...
  ニュース                   World news shown in the log
  地の文                     Narration (also some dialogue and messages)
  台詞                       Dialogue
  名詞：品物                 Item names and descriptions
  名詞：敵と技               Enemy names and their attack names
  名詞：国と地名             Nations, rulers and place names
  名詞：人物                 Characters, jobs, traits
  名詞：職業                 The hero's backgrounds (jobs)
  名詞：実績                 Achievements
  名詞：その他               Other names (golem types, etc.)
  組み立てた文の型と部品     Fragments and patterns used to build sentences

The categories are guessed from how each text appears in the code, so they
are not perfectly accurate (for example, some short messages are in
"Narration").


Things to keep as they are
--------------------------
  {0} {1} ...   Placeholders. The game puts a value here (a name, a number,
                another sentence). Keep every placeholder, but you may change
                their order:  "{0}の{1} → {2}"  ->  "{0}'s {1} → {2}"
  <b> <span ...> <br>
                HTML tags. Keep them around the same words.
  Emoji         Keep the emoji at the start of a line (🎲 ⚔️ 📜 ...).
                The game uses some of them to recognise the line.

Short texts that end or start with a space or particle (for example
" appears!" or "が現れた！") are pieces of longer sentences. The game joins
them with names. In en.json you can see how they were translated.

Many names are joined into sentences, so check your translation in the game.
Grammar problems that appear only with certain names can often be fixed with
"fixes" instead of changing many lines.


Checking your work
------------------
  - Load the file and play. Untranslated text appears in Japanese.
  - Watch the log during battles, travel and town menus.
  - The endings and the Records screen contain a lot of text.


Notes on the English translation
--------------------------------
The bundled English is a first draft. Corrections are welcome.

Some terms used in the English version:
  外れ (hazure)        "dud" — what the cult calls the summoned hero
  異邦人 (ihōjin)      "stranger" — the hero, someone from another world
  門を喰らうもの       "the Gate Eater"
  愉悦の女神           "the Goddess of Delight"
