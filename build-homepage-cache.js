#!/usr/bin/env node
// Generates homepage-data.js with pre-computed stats for instant homepage loading.
// Run after updating shows.js: node build-homepage-cache.js
const fs = require('fs');
const path = require('path');

const showsPath = path.join(__dirname, 'shows.js');
const outPath = path.join(__dirname, 'homepage-data.js');

const content = fs.readFileSync(showsPath, 'utf8');
const match = content.match(/var defined_shows = (\[[\s\S]*\]);/);
if (!match) { console.error('Could not parse shows.js'); process.exit(1); }
const shows = JSON.parse(match[1]);

const now = new Date();
const cities = new Set(shows.map(s => s.city).filter(Boolean));
const countries = new Set(shows.map(s => s.country).filter(Boolean));

// This week range
var dow = now.getDay();
var mon = new Date(now); mon.setDate(now.getDate() - (dow === 0 ? 6 : dow - 1));
var sun = new Date(mon); sun.setDate(mon.getDate() + 6);
var ws = mon.toISOString().slice(0, 10);
var we = sun.toISOString().slice(0, 10);
var todayStr = now.toISOString().slice(0, 10);
var weekShows = shows.filter(s => s.sort_date >= ws && s.sort_date <= we);
var todayShows = weekShows.filter(s => s.sort_date === todayStr);

// Nearest 4 upcoming
var upcoming = shows.filter(s => new Date(s.sort_date) >= now);
var nearest = [...upcoming].sort((a, b) => new Date(a.sort_date) - new Date(b.sort_date)).slice(0, 4).map(s => ({
    title: s.title, slug: s.slug, category: s.category, city: s.city,
    country: s.country, sort_date: s.sort_date, date: s.date
}));

// Trending 4 by attendance
var trending = upcoming.filter(s => s.attendees).sort((a, b) => {
    var na = parseInt((a.attendees || '0').replace(/[^0-9]/g, '')) || 0;
    var nb = parseInt((b.attendees || '0').replace(/[^0-9]/g, '')) || 0;
    return nb - na;
}).slice(0, 4).map(s => ({
    title: s.title, slug: s.slug, category: s.category, date: s.date,
    attendees: s.attendees
}));

var data = {
    totalShows: shows.length,
    totalCities: cities.size,
    totalCountries: countries.size,
    weekShowCount: weekShows.length,
    todayShowCount: todayShows.length,
    weekStart: ws,
    weekEnd: we,
    nearest: nearest,
    trending: trending,
    generated: now.toISOString()
};

var js = 'var HOMEPAGE_CACHE=' + JSON.stringify(data) + ';';
fs.writeFileSync(outPath, js);
console.log('Generated homepage-data.js (' + js.length + ' bytes)');
console.log('  Shows:', data.totalShows, '| Cities:', data.totalCities, '| Countries:', data.totalCountries);
console.log('  This week:', data.weekShowCount, '| Today:', data.todayShowCount);
