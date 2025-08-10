# Google Sheets Player Database Setup

## Quick Setup (5 minutes)

### 1. Create Your Google Sheet
1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new spreadsheet
3. Name it "FantasyBlock Player Database"

### 2. Set Up Your Players Sheet
In the first sheet (rename it to "Players"), create these column headers in row 1:

| A | B | C | D | E | F | G | H | I | J |
|---|---|---|---|---|---|---|---|---|---|
| ID | Name | Position | Team | Rank | ProjectedPoints | ADP | ByeWeek | Status | LastUpdated |

### 3. Add Sample Player Data
Here's some sample data to get started (paste starting from row 2):

```
1,Christian McCaffrey,RB,SF,1,285,1.2,9,active,2024-08-10
2,Austin Ekeler,RB,LAC,2,265,2.5,5,active,2024-08-10
3,Josh Allen,QB,BUF,3,315,3.1,13,active,2024-08-10
4,Cooper Kupp,WR,LAR,4,245,4.3,10,active,2024-08-10
5,Derrick Henry,RB,BAL,5,255,5.2,13,active,2024-08-10
6,Stefon Diggs,WR,HOU,6,235,6.1,14,active,2024-08-10
7,Davante Adams,WR,LV,7,230,7.4,13,active,2024-08-10
8,Travis Kelce,TE,KC,8,195,8.2,6,active,2024-08-10
9,Nick Chubb,RB,CLE,9,225,9.5,5,active,2024-08-10
10,Alvin Kamara,RB,NO,10,220,10.1,11,active,2024-08-10
```

### 4. Make Your Sheet Public (Read-Only)
1. Click "Share" button (top right)
2. Click "Change to anyone with the link"
3. Set permission to "Viewer"
4. Click "Done"

### 5. Get Your Sheet ID
1. Look at your sheet's URL:
   ```
   https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID_HERE/edit
   ```
2. Copy the ID between `/d/` and `/edit`

### 6. Add to Your Environment
1. Create a `.env.local` file in your project root
2. Add your Sheet ID:
   ```
   NEXT_PUBLIC_GOOGLE_SHEET_ID="your-sheet-id-here"
   ```

### 7. Test It!
1. Start your dev server: `npm run dev`
2. Navigate to `/draft-room`
3. You should see your players loading from Google Sheets!

## Adding More Players

Simply add more rows to your Google Sheet. The app fetches fresh data every 5 minutes (configurable).

## Sheet Structure

### Players Sheet (Main)
- **ID**: Unique identifier (number or string)
- **Name**: Player's full name
- **Position**: QB, RB, WR, TE, K, DST
- **Team**: NFL team abbreviation (SF, LAC, BUF, etc.)
- **Rank**: Overall rank (1-300+)
- **ProjectedPoints**: Season projection
- **ADP**: Average Draft Position (optional)
- **ByeWeek**: Week number (optional)
- **Status**: active, injured, suspended, etc.
- **LastUpdated**: Date of last update

### Optional: Additional Sheets
You can add more sheets (tabs) for:
- **PlayerStats**: Weekly statistics
- **Teams**: NFL team information
- **ScoringSettings**: League scoring rules

## Tips

1. **Keep Headers Clean**: Don't use spaces in column headers
2. **Data Validation**: Use Google Sheets data validation for positions and teams
3. **Bulk Import**: You can import CSV files directly into Google Sheets
4. **Auto-Update**: Consider using Google Apps Script to auto-update from ESPN/Yahoo APIs

## Troubleshooting

**Players not loading?**
- Check your Sheet ID in `.env.local`
- Ensure sheet is publicly viewable
- Check browser console for errors

**Wrong data showing?**
- Verify column headers match exactly
- Check for extra spaces in data
- Ensure first sheet (gid=0) contains player data

## Advanced: Using Service Account (Optional)

For private sheets or write access, you can use a service account:
1. Create a service account in Google Cloud Console
2. Share your sheet with the service account email
3. Use `googleapis` package instead of CSV export

But for most use cases, the simple CSV approach works great!