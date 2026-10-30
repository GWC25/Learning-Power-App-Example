# Building the Learning Studio in SharePoint and Power Apps

This repository is a working model of the SharePoint build. Every folder maps to something you create in SharePoint, and every screen in the [app mockup](https://gwc25.github.io/Learning-Power-App-Example/app/) uses only standard Power Apps controls. Turn on **Show Power Apps control names** in the mockup to see which control each element is. Open **Build notes for this screen** under the app to see its Power Fx.

| In this repository | In SharePoint and Power Apps |
|---|---|
| `lists/Situations.csv` | List: **Situations** |
| `lists/BuildingBlocks.csv` | List: **Building Blocks** |
| `lists/ResourceCards.csv` | List: **Resource Cards** (one row per resource) |
| `lists/CardSteps.csv` | List: **Card Steps** (one row per step, four lenses per row) |
| `lists/CardLinks.csv` | List: **Card Links** (guides, research and further reading) |
| `library/videos/` | **Resource Files** library, Videos folder (played through Stream) |
| `library/guides/` | **Resource Files** library, How-to guides folder (Word documents) |
| `library/how-to/` | The same guides as Markdown, the source the Word files are built from |
| `app/index.html` | The canvas app, embedded on one SharePoint page |

Nothing in the app needs editing to add a resource. You add rows to the lists and files to the library.

---

## 1. Create the site and the library

1. Create a SharePoint communication site called **Learning Studio**.
2. Create a document library called **Resource Files**, with two folders: **Videos** and **How-to guides**.
3. Upload the seven videos from `library/videos/`. Every video stored in SharePoint opens in Stream.
4. For each video, open it, select **Share**, then **Embed code**. Copy the URL from `https://` up to and including the `UniqueId=` value. You need it in step 3.
5. Upload the Word guides from `library/guides/` to the How-to guides folder. They are already built with real heading styles, numbered lists and UK English set as the language. Open one and run **Review**, **Check Accessibility** as a final check.

The seven library videos have no sound. Their how-to guide is the text alternative, so each video's row must link to its guide (see `TranscriptLink`).

## 2. Create the five lists

For each CSV in `lists/`: in the site, select **New**, then **List**, then **From CSV**, and upload the file. Before you select **Create**, set the column types below. Anything not listed stays as **Single line of text**.

**Resource Cards**

| Column | Type |
|---|---|
| Level | Choice: Foundations, Inclusion, Innovation |
| LevelOrder | Number |
| Context | Choice: Any context, Theory delivery, Practical / workshop, Project / outreach, Exam preparation |
| Summary, WhyItWorks, WatchOutFor, PracticeScenario, PracticeAnswer, PromptText, Keywords | Multiple lines of text, plain text |
| VideoSource | Choice: YouTube, Library |
| VideoLink, TranscriptLink, CaptionsLink | Single line of text (holds a URL) |

**Card Steps**: StepNo is **Number**. Traditional, Digital, Accessibility and InclusivePractice are **Multiple lines of text, plain text**.

**Card Links**: SortOrder is **Number**. LinkType is **Choice**: How-to guide, Microsoft guide, Standard, Research, Explore further.

**Building Blocks**: Level is **Choice** (as above), SortOrder is **Number**.

**Situations**: SortOrder is **Number**, Keywords is **Multiple lines of text**.

Then update the links that point at GitHub so they point at SharePoint:

- In **Resource Cards**, for rows where VideoSource is **Library**, paste the Stream embed URL into **VideoLink**, and the guide's SharePoint link into **TranscriptLink**.
- In **Card Links**, replace each `gwc25.github.io/.../library/guides/...` URL with the SharePoint link to that guide.

In the online demo, guides open in Microsoft's free Office viewer, because GitHub Pages cannot open Word for the web. In SharePoint you do not need the viewer: `Launch(ThisItem.URL)` opens the file in Word for the web for anyone signed in.

## 3. Build the app

1. Go to make.powerapps.com, select **Create**, then **Blank app**, then **Blank canvas app**. Choose **Tablet** format and turn on **Scale to fit: Off** in Settings, Display, so the app is responsive.
2. Select **Data**, **Add data**, **SharePoint**, choose the Learning Studio site and tick all five lists.
3. In **Settings**, **General**, set **Data row limit** to 2000.
4. Set **App.OnStart**:

```
ClearCollect(colCards, 'Resource Cards');
ClearCollect(colBlocks, 'Building Blocks');
ClearCollect(colSituations, 'Situations');
Set(varTraditional, true); Set(varDigital, true);
Set(varAccessibility, true); Set(varInclusive, true)
```

Loading the lists into collections means every filter runs inside the app, with no delegation warnings.

### Screens

Build each screen inside vertical and horizontal **containers** so it reflows on phones. Every screen has the same header container: a Label for the app name and a horizontal Gallery of Buttons for navigation.

| Screen | Main controls |
|---|---|
| scrHome | Heading Label, intro Label, Gallery of three route cards (Label + Button), Gallery of the four lenses |
| scrFinder | Progress Gallery, three Radio controls shown one at a time, error Label, Back and Next Buttons |
| scrBrowse | Dropdowns for Layer and Context, Text input, Apply and Reset Buttons, count Label, vertical Gallery of cards |
| scrBlocks | Gallery of three Buttons drawn as the pyramid, Labels for the layer and its research, Gallery of blocks |
| scrCard | Labels, Video control (YouTube), Stream control (library videos), four Toggles, flexible-height Gallery of steps, practice Container, Gallery of links, step up and step down Buttons |

The Power Fx for each screen is in the mockup under **Build notes for this screen**. The most important formulas:

```
// scrBrowse
galCards.Items =
  SortByColumns(
    Filter(colCards,
      (IsBlank(varSituation) || varSituation in SituationIDs) &&
      (IsBlank(ddLayer.Selected.Value) || Level.Value = ddLayer.Selected.Value) &&
      (IsBlank(ddContext.Selected.Value) ||
         Context.Value = ddContext.Selected.Value || Context.Value = "Any context") &&
      (IsBlank(varBlock) || BlockID = varBlock) &&
      (IsBlank(txtSearch.Text) || txtSearch.Text in Title || txtSearch.Text in Keywords)),
    "LevelOrder")

// scrCard
galSteps.Items = SortByColumns(Filter('Card Steps', CardID = varCard.CardID), "StepNo")
lblDigital.Visible = tglDigital.Value          // one Label and one Toggle per lens

vidYouTube.Visible = varCard.VideoSource = "YouTube"
vidYouTube.Media   = varCard.VideoLink
strLibrary.Visible = varCard.VideoSource = "Library"
strLibrary.StreamUrl = varCard.VideoLink

btnAnswer.OnSelect = UpdateContext({locShowAnswer: !locShowAnswer})
btnCopy.OnSelect   = Copy(varCard.PromptText)
btnStepUp.OnSelect = Set(varCard, LookUp(colCards, CardID = varCard.StepUpID))
btnLink.OnSelect   = Launch(ThisItem.URL)
```

## 4. Make the app accessible (WCAG 2.2 AA)

Microsoft's guidance for accessible canvas apps, applied to this app:

- Every screen has a heading: a Label with **Role** set to Heading 2, and section Labels set to Heading 3 or 4.
- Every interactive control has an **AccessibleLabel**. Buttons that repeat in a gallery include the item, for example `"Open: " & ThisItem.Title`.
- **FocusedBorderThickness** is 3 or more on every control, in a colour with at least 3 to 1 contrast against its background.
- Videos have **AutoStart** off and **ShowControls** on. YouTube captions come from YouTube. Library videos have no sound, so the how-to guide button sits next to the player as the text alternative.
- The count Label on scrBrowse has **Live** set to Polite. The Finder error Label has **Live** set to Assertive.
- Colour never carries meaning on its own. Every layer badge and every lens shows its name in text.
- Colours used (all at least 4.5 to 1 against their background):

| Use | Colour | Text on it |
|---|---|---|
| Foundations | #005A70 | White |
| Inclusion | #1D4E89 | White |
| Innovation | #6A2A8A | White |
| Header and buttons | #1F3864 | White |
| Lens: Traditional | #3B3A39 on #F3F2F1 | |
| Lens: Digital | #0B5394 on #E8F0FA | |
| Lens: Accessibility | #8A3B00 on #FDF1E7 | |
| Lens: Inclusive practice | #0B6A3A on #E8F5EE | |

Before publishing, select **App checker**, then **Accessibility**, and clear every error and warning. Then test with Narrator (Windows key + Ctrl + Enter) and with the keyboard only.

## 5. Put the app on the page

1. Save and publish the app. Share it with staff (everyone who uses it also needs read access to the site).
2. On the Learning Studio site, create a page. Add the **Power Apps** web part.
3. Paste the app's web link or app ID, which you find under the app's **Details**.
4. Set the web part height so the app has room, for example 900 pixels, and turn on **Border**.

## 6. Add a new resource later

1. Add one row to **Resource Cards**.
2. Add a row to **Card Steps** for each step, with all four lenses filled in.
3. Add rows to **Card Links** for its guides and research.
4. Upload any video or guide to **Resource Files**.

The app picks it up the next time it opens. No app edit, no new page.

## Known limits

- The **Stream** control is in preview. Microsoft lists its limits: it accepts only `*.sharepoint.com` embed URLs, and no more than four should sit on one screen. If it does not accept a formula for the URL in your tenant, link out to the video instead.
- Keyword search matches words in the Title and Keywords columns. It does not understand meaning, so keep the Keywords column rich.
- `ClearCollect` brings in up to the data row limit (2000) per list. That is plenty for this design.
- Power Apps has no built-in read-aloud. Learners use their own screen reader or Immersive Reader on the linked guides.

## Sources

- [Microsoft Learn: Audio and Video controls in Power Apps](https://learn.microsoft.com/power-apps/maker/canvas-apps/controls/control-audio-video)
- [Microsoft Learn: Stream control (based on SharePoint) in Power Apps](https://learn.microsoft.com/power-apps/maker/canvas-apps/controls/modern-controls/new-stream-video-control)
- [Microsoft Learn: Create accessible canvas apps](https://learn.microsoft.com/power-apps/maker/canvas-apps/accessible-apps)
- [Microsoft Learn: Review a canvas app for accessibility](https://learn.microsoft.com/power-apps/maker/canvas-apps/accessibility-checker)
