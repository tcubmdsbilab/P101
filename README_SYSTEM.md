# README_SYSTEM｜SBI Lab P101 Counter Website

## Project Identity

- Website: 智慧商情研究室入口網站
- English Name: Smart Business Intelligence Lab (SBI Lab)
- Unit: 慈濟大學 經營管理學系
- Current project displayed: P101 校園空間查詢系統
- Current latest version: V02
- V02 URL: https://liu-ming-yi.github.io/CampusMap01

## Current Function

This package is a GitHub Pages static website with Supabase-backed counters.

It supports:

1. Main page view counter.
2. Version click counters.
3. P101 V01 and V02 display under the same project card.
4. V02 as the primary latest-version link.
5. Historical version preservation.

## Naming Rules

All database objects for this project use the P101 prefix.

Tables:

- `TblP101ViewCounters`
- `TblP101ViewEvents`

RPC function:

- `p101_increment_counter`

Counter keys:

- `P101_MAIN_PAGE`
- `P101_VERSION_V01`
- `P101_VERSION_V02`

## Frontend Files

- `index.html`: main page.
- `assets/styles.css`: visual design.
- `assets/app.js`: project data and counter logic.
- `config.example.js`: copy to `config.js` and fill in Supabase settings.

## Deployment Rule

Never place a Supabase service_role key in frontend files. Only the anon key may be used in `config.js`.

## Counter Rule

The frontend must not directly update counter rows. It must call the RPC function:

```javascript
p101_increment_counter(counter_key, session_id, referrer)
```

This preserves atomic counting and keeps the write path controlled.

## Future Upgrade Direction

If this website expands beyond P101, consider changing from P101-specific tables to general lab-level tables such as:

- `TblSBIProjects`
- `TblSBIProjectVersions`
- `TblSBIViewCounters`
- `TblSBIViewEvents`

For the current request, table names intentionally keep the P101 prefix.
