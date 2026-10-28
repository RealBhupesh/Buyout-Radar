# Design-law audit

Re-read against the supplied pols.dev law on 28 October 2026. This is a research application, so marketing-section prescriptions are assessed for applicability, not inserted as decorative content. The actual product, a populated and interactive underwriting workspace, is the signature artifact. Fictional financials are labeled consistently.

## Execution checks

Desktop and 390px mobile browser captures inspected. Real pointer and keyboard workflows cover filters, all assumption dials and advanced fields, presets, source inspection, notes, sensitivity, hurdle actions, copy link, watchlists and downloads. Five-year histories and comparison columns use actual tables. Production tests cover default-visible content with JavaScript disabled and reduced motion. A mobile overflow from absolutely positioned accessibility text was found and fixed by positioning the table's scroll container. A Next.js streaming loading boundary also left the no-JavaScript browser at the loading message; removing that boundary makes the actual research content render before the response is shown. No glyph, input, control or source dialog is intentionally cropped.

## Prohibited defaults, point by point

| Law entry                                | Review result                                                                                                                               |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Lucide React package                     | No icon-pack dependency. Bare filled navigation glyphs and a specific radar mark.                                                           |
| Em dashes                                | Product copy uses periods, commas, slashes and colons.                                                                                      |
| Pill / eyebrow badge                     | No hero badges. Data-mode notice is a load-bearing disclosure, not decoration.                                                              |
| Fraunces and Work Sans                   | Neither loaded.                                                                                                                             |
| Glowy pill buttons                       | None. Buttons are grounded tonal rectangles.                                                                                                |
| Oversized icon in a colored tile         | None. Mobile active nav tiles were removed.                                                                                                 |
| Floating cards                           | None.                                                                                                                                       |
| Cut-off glow                             | No glow to clip.                                                                                                                            |
| Kitchen-sink card                        | No pricing or stacked promotional cards.                                                                                                    |
| Fake macOS / app window                  | No faux chrome. The product is working UI.                                                                                                  |
| Space Grotesk                            | Not loaded.                                                                                                                                 |
| Purple / blue-purple gradient            | No purple or gradients.                                                                                                                     |
| Gradient pill + icon + text              | Absent.                                                                                                                                     |
| Default CTA button pair                  | No paired filled and outlined actions.                                                                                                      |
| Three-tier pricing                       | Not applicable and absent.                                                                                                                  |
| Testimonial / ornamental quotation cards | No testimonials or decorative quote marks.                                                                                                  |
| Gradient initials avatar                 | No invented people or avatars.                                                                                                              |
| Pre-footer CTA banner                    | Absent. Footer is a quiet application colophon.                                                                                             |
| Gradient tile logo lockup                | Inline logo is a bare radar mark. Favicon background tile removed.                                                                          |
| Cormorant Garamond                       | Not loaded.                                                                                                                                 |
| Split hero                               | No marketing hero. Desk heading, metrics, working map and financial table form an application.                                              |
| Graph-paper background                   | None. Dotted guides belong only to real financial plots.                                                                                    |
| Crude CSS/SVG illustrations              | No decorative stand-ins. SVGs plot actual computed values.                                                                                  |
| Accent-bar card                          | Absent.                                                                                                                                     |
| Background glow                          | Absent.                                                                                                                                     |
| Fake code-snippet window                 | Absent.                                                                                                                                     |
| Sora / JetBrains Mono                    | Neither loaded.                                                                                                                             |
| Floating image tag                       | No decorative image tags.                                                                                                                   |
| Syne                                     | Not loaded.                                                                                                                                 |
| Gradient headline text                   | Absent.                                                                                                                                     |
| Archivo / Inter everywhere               | Neither loaded. System sans handles dense working content.                                                                                  |
| Hairline light card borders              | No repeated outlined cards. Tone defines surfaces.                                                                                          |
| Countdown timer                          | No manufactured urgency.                                                                                                                    |
| Card hover-lift                          | No translating cards or shadows.                                                                                                            |
| Letterspaced serif wordmark              | Logo is compact mixed-case sans with custom mark.                                                                                           |
| Didone serif defaults                    | Not loaded. Sentient was selected and self-hosted for modest titles.                                                                        |
| Monospace as house voice                 | No house mono. Numeric tables use tabular figures.                                                                                          |
| One label treatment everywhere           | Sentence case, distinct data values, captions and normal buttons.                                                                           |
| Botched glass                            | No glass or backdrop blur.                                                                                                                  |
| Faint full-page grid                     | Absent.                                                                                                                                     |
| Botched fill animation                   | Tracks display actual values without fill-animation tricks.                                                                                 |
| Invisible-content entrance trap          | Content fully server-rendered and visible before JavaScript. Motion circles use initial=false.                                              |
| Sliced content / clear the cut           | Table scrolling contains overflow, not live text. Source dialogs scroll vertically. No decorative clip-path.                                |
| Ragged comparison grid                   | Tables share financial-year columns and sensitivity rows. Summary roles align.                                                              |
| Text jammed against edge                 | 22px mobile and 28-60px desktop gutters. Controls have internal padding.                                                                    |
| Default all-around shadow                | No drop shadows. Sensitivity selection uses a tight inset state stroke.                                                                     |
| Content flung to far edges               | Application columns share one grid. Footer aligns to the same content margins.                                                              |
| Missing / faked logos                    | No invented customers, integrations or social proof. No irrelevant logo wall.                                                               |
| Chronic centering miss                   | Buttons, bare glyphs, sensitivity cells and dialog close controls checked. SVG plot labels use explicit coordinates and text anchors.       |
| Faked shadow with second box             | No duplicate shadow geometry.                                                                                                               |
| Icon / logo with box behind              | Inline marks are bare. Active navigation is a text-row state; icon-only mobile links have no box.                                           |
| Eyebrow tick                             | Absent.                                                                                                                                     |
| Oversized footer wordmark slop           | Absent. No signature word pasted into the footer.                                                                                           |
| Colliding colors / hard seams            | Single forest and tonal sage system. White is the reading surface. Dark plot is an actual bounded chart, not an accidental atmospheric cut. |
| Hard-edged boxy shadow                   | No drop shadows.                                                                                                                            |
| Unreadable text contrast                 | Dark ink on paper; pale type on forest. Small labels inspected. No low-value text on saturated fills.                                       |
| Blurred silhouette bloom                 | None.                                                                                                                                       |
| Dot below active nav                     | Active state uses tone and weight.                                                                                                          |
| Content clipped by overlapping sections  | No overlapping sections. Sticky assumption panel has its own grid column.                                                                   |
| Cramped display type                     | Title and returns use controlled tracking; number/unit spacing remains distinct.                                                            |
| Grain over content                       | No noise layer. Text remains crisp.                                                                                                         |
| Cool blue-charcoal default               | Dark surfaces use chosen green-black.                                                                                                       |
| Pastel candy gradient                    | Absent.                                                                                                                                     |
| Drifting gradient blobs                  | Absent.                                                                                                                                     |
| Radial object halo                       | Absent.                                                                                                                                     |
| Hero does not own fold                   | This is an application, not a landing hero. The first viewport intentionally reveals working research content.                              |
| Cream / beige editorial base             | Near-white paper, not cream.                                                                                                                |
| Default UI-kit slop gray                 | Surfaces are specifically sage/forest, not gray-100.                                                                                        |
| Default Google font rotation             | No Google Fonts requests. Self-hosted ITF Sentient and neutral OS text.                                                                     |
| Hover boop                               | No button transform or scaling.                                                                                                             |
| Inner-glow badge                         | No glowing badges or pulsing live dots.                                                                                                     |
| Off-center strike line                   | No strike-through.                                                                                                                          |
| Default hero stack                       | No eyebrow/headline/subline/two-CTA marketing skeleton.                                                                                     |
| Fixed scrolling background               | No fixed decorative background.                                                                                                             |
| Hard image seam                          | No full-bleed imagery or image seams.                                                                                                       |
| Saturated accent spray                   | Tonal sage and forest; no poster-bright accent.                                                                                             |
| Underline-fill hover                     | No animated underlines.                                                                                                                     |
| Sun/moon switch / redrawn line pack      | No theme switch. Functional glyphs use filled silhouettes; radar identity has specific segmented geometry.                                  |
| Unrounded ornamental rules               | No rules as decoration. Financial plot guides encode scale.                                                                                 |
| Kicker + serif section head              | Work sections open with a direct heading, number or working artifact.                                                                       |
| Big serif statement block                | None.                                                                                                                                       |
| Inset enquire island                     | No enquiry marketing section.                                                                                                               |
| Email pill + button form                 | No newsletter capture.                                                                                                                      |
| Image card + overlay caption             | Absent.                                                                                                                                     |
| Flat fill after impressive hero          | No bait-and-switch landing hero. The actual map, debt chart, model surfaces and evidence tables carry the complete application.             |
| Recycled house style                     | One research-specific system; no portfolio, pricing or testimonial stack.                                                                   |
| Hero with panel on right                 | No marketing hero. Workbench assumptions are actual persistent working controls.                                                            |
| Multi-line dangling accent headline      | Desk heading max two lines on mobile; no isolated colored word.                                                                             |
| Filled + outlined button pair            | No outline secondary. Actions use text or tonal states.                                                                                     |
| Small label over big section heading     | No repeated kicker scaffolding in work sections. Breadcrumbs navigate real context.                                                         |
| Numbered steps on vertical rail          | Absent.                                                                                                                                     |
| Compounding slop layouts                 | No sequence of stock marketing sections.                                                                                                    |
| SaaS meta-template                       | No features/pricing/FAQ/CTA assembly.                                                                                                       |
| Metadata pill chips everywhere           | Plain metadata text. Data mode gets a necessary explanatory surface.                                                                        |
| Dead controls                            | Real browser tests cover visible controls and downloads. No fake search or mock tabs.                                                       |
| Tasteful font swap                       | Typeface supports a finance desk and is limited to editorial titles; the signature is the working model.                                    |
| Same skeleton recolored                  | Application built from the underwriting task, not a reskinned site.                                                                         |
| Standard four-column footer              | No link-farm footer.                                                                                                                        |
| No icons overcorrection                  | Useful bare marks remain.                                                                                                                   |
| Avoiding list is not design              | The opportunity map and responsive financial workbench are the central authored decisions.                                                  |

## Premium guidance and signature formula

| Guidance                             | Decision                                                                                                                  |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| Real translucency / liquid glass     | Intentionally unused; financial legibility wins.                                                                          |
| Self-colored edges / tonal elevation | Grounded sage panels and forest plot; no ornamental card strokes.                                                         |
| Bespoke geometry                     | Segmented radar identity, coordinated filled nav marks and real plotted points. No gratuitous notches.                    |
| Bare icons                           | Used throughout.                                                                                                          |
| Say less                             | Short controls and concise desk copy; detailed methodology lives on its own page.                                         |
| In-house iconography                 | Small consistent set of useful marks, no icon tile grid.                                                                  |
| Authored micro-interactions          | Spring-based map positions respond to filters and selection; hover changes tone.                                          |
| Considered light                     | No lighting effects needed for this research product.                                                                     |
| Premium noise                        | Deliberately unused so numbers stay crisp.                                                                                |
| Glass recipe                         | Not applied mechanically.                                                                                                 |
| Licensed/self-hosted type            | Sentient files and license attribution included.                                                                          |
| Large-scale composition              | A full desk with a contained navigation spine, real map and dense table.                                                  |
| Earned logo wall                     | Not earned; omitted honestly.                                                                                             |
| Blueprint background                 | Not appropriate; omitted.                                                                                                 |
| Inset island                         | Used only for working plots and model controls, not a templated enquiry section.                                          |
| Crafted SVG                          | Actual financial charts and radar mark; no stock art filler.                                                              |
| Gloss                                | No glass.                                                                                                                 |
| Professional with heartbeat          | Reactive map, live assumptions, selectable sensitivity and immediate research actions.                                    |
| Fine textured micro-grid             | Not used.                                                                                                                 |
| Grainy gradients                     | No gradients, hence no banding.                                                                                           |
| Scroll-authored motion               | Not added to a data application; reduced-motion-safe direct interactions serve the task.                                  |
| Giant footer wordmark                | Not needed; omitted.                                                                                                      |
| Signature artifact                   | The interactive opportunity map and populated underwriting model.                                                         |
| Atmosphere                           | Research environment formed by the forest navigation, plotted dark surface and paper financials.                          |
| Layered depth                        | Working hierarchy and sticky model controls, not decorative overlapping cards.                                            |
| Real populated product               | Every displayed control, statement, projection and source register is functional.                                         |
| Character display type               | Self-hosted Sentient.                                                                                                     |
| Bespoke silhouette                   | Segmented bare radar mark. No decorative cuts that threaten content.                                                      |
| Treated nav                          | A considered full-height forest navigation spine; compact bare marks on mobile.                                           |
| Real specificity                     | Exact sample periods, units, assumptions and transparent fictional labeling. No fake claims.                              |
| Signature serif / two-tone headline  | Character face used; two-tone emphasis intentionally omitted.                                                             |
| Full-bleed atmospheric hero          | Not relevant to a research workspace.                                                                                     |
| Animated ASCII field                 | Not relevant; omitted.                                                                                                    |
| Jewel gradient icon                  | Not relevant; omitted.                                                                                                    |
| Authored arrows                      | Single diagonal arrow construction used for inspection actions.                                                           |
| Synchronized visual language         | One palette, type system, control radius and chart grammar.                                                               |
| Glass CTA                            | Not needed.                                                                                                               |
| Real component primitives            | Radix Dialog supplies focus management, Escape and modal semantics. Native range/select/input supply tested fundamentals. |
| Standing animation toolkit           | Motion drives responsive chart positions without hidden initial content.                                                  |
| De-slop prebuilt pieces              | Radix behavior retained; appearance belongs to the research system.                                                       |
| Cohesion                             | One forest-and-paper world, no competing display face or accent family.                                                   |
| Creative vs realistic                | No stock realism needed; the real product is the artifact.                                                                |
| Fontshare alternative                | Official self-hosted assets, with source attribution.                                                                     |
| Product-as-artifact                  | Actual detailed, editable finance UI, not a picture of an application.                                                    |
| References are language              | No reference copy, customer marks or product content reproduced.                                                          |
| Free grotesque generic risk          | Neutral body does not carry identity; display has distinct editorial character.                                           |
| Dead-looking failure                 | Functional, responsive motion and state changes are verified.                                                             |

The most specific prohibitions take precedence over conflicting technique examples: no glow, no background grid, no entrance opacity, no pill CTA pair and no growing underline were added merely because a later example mentions them.
