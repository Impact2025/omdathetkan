'use client';

import { useState } from 'react';

const notes = [
  {
    id: 1,
    title: 'Notitie app idee',
    date: '8 apr',
    preview: 'Een simpele app om notities bij te houden...',
    content: `# Notitie app idee

Een simpele app om notities bij te houden. Werkt offline, geen account nodig.

## Functies

- Notities aanmaken en bewerken
- Mappen voor organisatie
- Zoekfunctie
- Offline beschikbaar
- Donkere modus
- Snel openen via widget

## Design

Minimalistisch. Geen afleiding, gewoon tekst. Snelle laadtijd. Geen onnodige functies of meldingen.

## Technisch

- PWA zodat het als echte app werkt
- Lokale opslag als standaard
- Optioneel synchroniseren via account
- Markdown ondersteuning

## Vergelijkbare apps

Bear, Notion, Apple Notes, Obsidian. Ik wil iets simpeler dan Notion maar met meer structuur dan Apple Notes.

## Volgende stappen

Prototype bouwen. Beginnen met alleen tekst, daarna functies toevoegen.`,
  },
  {
    id: 2,
    title: 'Boodschappenlijst',
    date: '7 apr',
    preview: 'Melk, brood, kaas, appels...',
    content: `# Boodschappenlijst

- Melk
- Brood
- Kaas
- Appels
- Pasta
- Tomatensaus
- Olijfolie
- Knoflook
- Ui
- Yoghurt`,
  },
  {
    id: 3,
    title: 'Boeken om te lezen',
    date: '2 apr',
    preview: 'Atomic Habits, Deep Work...',
    content: `# Boeken om te lezen

## Bezig
- Atomic Habits - James Clear

## Wil ik lezen
- Deep Work - Cal Newport
- The Pragmatic Programmer
- Thinking, Fast and Slow - Daniel Kahneman
- A Philosophy of Software Design

## Gelezen
- Zero to One - Peter Thiel
- The Lean Startup`,
  },
  {
    id: 4,
    title: 'Weekend ideeen',
    date: '31 mrt',
    preview: 'Wandelen, museum, thuis koken...',
    content: `# Weekend ideeen

- Wandelen in het bos
- Naar het museum
- Thuis koken, iets nieuws proberen
- Fietsen langs het water
- Film kijken
- Vrienden bellen
- Opruimen, eindelijk dat kastje aanpakken`,
  },
];

export default function NotitiesPage() {
  const [activeNote, setActiveNote] = useState(notes[0]);
  const [search, setSearch] = useState('');

  const filtered = notes.filter(
    (n) =>
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.content.toLowerCase().includes(search.toLowerCase())
  );

  const renderContent = (content: string) => {
    return content.split('\n').map((line, i) => {
      if (line.startsWith('# ')) {
        return (
          <h1 key={i} className="text-2xl font-bold text-gray-900 mb-4 mt-2">
            {line.slice(2)}
          </h1>
        );
      }
      if (line.startsWith('## ')) {
        return (
          <h2 key={i} className="text-base font-semibold text-gray-700 mb-2 mt-5">
            {line.slice(3)}
          </h2>
        );
      }
      if (line.startsWith('- ')) {
        return (
          <li key={i} className="text-gray-600 text-sm ml-4 mb-1 list-disc">
            {line.slice(2)}
          </li>
        );
      }
      if (line.trim() === '') {
        return <div key={i} className="h-2" />;
      }
      return (
        <p key={i} className="text-gray-600 text-sm mb-1">
          {line}
        </p>
      );
    });
  };

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      {/* Sidebar */}
      <div className="w-72 border-r border-gray-200 bg-white flex flex-col">
        {/* Sidebar header */}
        <div className="px-4 pt-6 pb-3">
          <h1 className="text-lg font-semibold text-gray-900 mb-3">Notities</h1>
          <input
            type="text"
            placeholder="Zoeken..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-gray-100 rounded-lg outline-none text-gray-700 placeholder-gray-400 focus:bg-gray-200 transition-colors"
          />
        </div>

        {/* Note list */}
        <div className="flex-1 overflow-y-auto">
          {filtered.map((note) => (
            <button
              key={note.id}
              onClick={() => setActiveNote(note)}
              className={`w-full text-left px-4 py-3 border-b border-gray-100 transition-colors ${
                activeNote.id === note.id
                  ? 'bg-gray-100'
                  : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex items-baseline justify-between mb-1">
                <span className="text-sm font-medium text-gray-900 truncate pr-2">
                  {note.title}
                </span>
                <span className="text-xs text-gray-400 shrink-0">{note.date}</span>
              </div>
              <p className="text-xs text-gray-400 truncate">{note.preview}</p>
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="px-4 py-6 text-sm text-gray-400 text-center">
              Geen notities gevonden
            </p>
          )}
        </div>

        {/* New note button */}
        <div className="p-4 border-t border-gray-200">
          <button className="w-full py-2 text-sm text-gray-500 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
            Nieuwe notitie
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-8 py-10">
          {renderContent(activeNote.content)}
        </div>
      </div>
    </div>
  );
}
