# E-book content generation script
# Generate Markdown e-book chapters from JSON data
# Author: SlangHome
# Version: 1.0

param jsonFile Input JSON file path
param outputDir Output directory
param bookName Book name (e.g. "Egyptian Travel Phrases")
param langPair Language pair (e.g. "Arabic-English")
param maxEntries Max entries per scene (default: 10)
param includeEvolution Include evolution history (default true)
param includeCulturalNotes Include cultural background (default true)
param includeDialogues Include dialogue scenes (default true)
param includePronunciationTips Include pronunciation guide (default false)
param includeCulturalTips Include cultural tips (default false)
param includeWarnings Include warnings (default false)
param includePitfalls Include common mistakes (default false)

# Read and parse JSON data
$entries = Get-Content $jsonFile | ConvertFrom-Json
$entries = $entries | Sort-Object { $_.origin }

# Group by scene
$grouped = @{}
foreach ($entry in $entries) {
    $category = if ($entry.categories) {
        $entry.categories[0]
    } else {
        "Others" }
    
    if (-not $grouped.ContainsKey($category)) {
        $grouped[$category] = @()
    }
    $grouped[$category] += $entry
}
