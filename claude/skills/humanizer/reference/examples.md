# Before and after pairs

Worked examples for patterns 6 to 26, numbered as in [SKILL.md](../SKILL.md). Every After uses only facts present in its Before. The long forms of 14, 17, and 23 are in [encyclopedic.md](encyclopedic.md).

## 6. Forced triads

> The event features keynote sessions, panel discussions, and networking opportunities. Attendees can expect innovation, inspiration, and industry insights.
>
> **After:** The event has keynotes and panels, with time for networking.

> A career can look promising and fail. A relationship can feel important and end. A skill can take years and remain useless. These decisions rarely explain themselves.
>
> **After:** A career can look promising and fail. So can a relationship that felt important and ended, or a skill that took years and remained useless. These decisions rarely explain themselves.

## 7. Repeated sentence openings

> She noted the door. She noted the lock on it. She filed both away.
>
> **After:** She noted the door and its lock, then filed both away.

## 8. Dashes

> The new policy — announced without warning — affects thousands of workers. The changes -- long overdue according to critics -- will take effect immediately.
>
> **After:** The new policy, announced without warning, affects thousands of workers. The changes, long overdue according to critics, will take effect immediately.

## 9. Stacked qualifiers

> It could potentially possibly be argued that the policy might have some effect on outcomes.
>
> **After:** The policy may affect outcomes.

## 10. Hyphenated pairs everywhere

> The report is high-quality, the process is well-documented, and the plan is long-term.
>
> **After:** The report is high quality, the process is well documented, and the plan is long term.

## 11. Passive voice and missing subjects

> The migration was reviewed by the platform team, and the rollout was approved by them on Friday.
>
> **After:** The platform team reviewed the migration and approved the rollout on Friday.

## 12. Overused AI words

> Additionally, a distinctive feature of Somali cuisine is the incorporation of camel meat. An enduring testament to Italian colonial influence is the widespread adoption of pasta in the local culinary landscape, showcasing how these dishes have integrated into the traditional diet.
>
> **After:** Somali cuisine also includes camel meat. Pasta, introduced under Italian colonial rule, is now part of the traditional diet.

## 13. Inflated significance

> The Statistical Institute of Catalonia was officially established in 1989, marking a pivotal moment in the evolution of regional statistics in Spain. This initiative was part of a broader movement across Spain to decentralize administrative functions and enhance regional governance.
>
> **After:** The Statistical Institute of Catalonia was established in 1989, part of a wider decentralization of administrative functions in Spain.

## 15. Shallow -ing riders

> The temple's color palette of blue, green, and gold resonates with the region's natural beauty, symbolizing Texas bluebonnets, the Gulf of Mexico, and the diverse Texan landscapes, reflecting the community's deep connection to the land.
>
> **After:** The temple is painted blue, green, and gold, colors meant to evoke Texas bluebonnets, the Gulf of Mexico, and the Texan landscape.

## 16. Sales language

> Nestled within the breathtaking region of Gonder in Ethiopia, Alamata Raya Kobo stands as a vibrant town with a rich cultural heritage and stunning natural beauty.
>
> **After:** Alamata Raya Kobo is a town in the Gonder region of Ethiopia.

## 18. Avoiding is, are, and has

> Gallery 825 serves as LAAA's exhibition space for contemporary art. The gallery features four separate spaces and boasts over 3,000 square feet.
>
> **After:** Gallery 825 is LAAA's exhibition space for contemporary art. The gallery has four spaces and over 3,000 square feet.

## 19. Bold as decoration

> It blends **OKRs (Objectives and Key Results)**, **KPIs (Key Performance Indicators)**, and visual strategy tools such as the **Business Model Canvas (BMC)** and **Balanced Scorecard (BSC)**.
>
> **After:** It blends OKRs, KPIs, and visual strategy tools like the Business Model Canvas and Balanced Scorecard.

> - **User Experience:** The user experience has been significantly improved with a new interface.
> - **Performance:** Performance has been enhanced through optimized algorithms.
> - **Security:** Security has been strengthened with end-to-end encryption.
>
> **After:** The update adds a new interface, optimized algorithms, and end-to-end encryption.

## 20. Decorative headings

> ## Strategic Negotiations And Global Partnerships
>
> **After:** ## Strategic negotiations and global partnerships

> 🚀 **Launch Phase:** The product launches in Q3
> 💡 **Key Insight:** Users prefer simplicity
>
> **After:** The product launches in Q3. Users prefer simplicity.

## 21. Curly quotation marks

> He said “the project is on track” but others disagreed.
>
> **After:** He said "the project is on track" but others disagreed.

## 22. Chatbot residue

> Great question! Here is an overview of the French Revolution. It began in 1789 when a financial crisis and food shortages led to widespread unrest. I hope this helps! Let me know if you'd like me to expand on any section.
>
> **After:** The French Revolution began in 1789 when a financial crisis and food shortages led to widespread unrest.

## 24. A heading repeated in the first sentence

> ## Performance
>
> Speed matters.
>
> When users hit a slow page, they leave.
>
> **After:**
>
> ## Performance
>
> When users hit a slow page, they leave.

## 25. Writing about the document instead of its subject

> This function was added to replace the previous approach of iterating through all items, which caused O(n²) performance.
>
> **After:** Avoids the O(n²) cost of iterating through all items.

> The figures below are drawn from each vendor's published pricing; anything we could not confirm is flagged rather than guessed.
>
> **After:** Prices are each vendor's published rate. Unconfirmed figures are flagged.

## 26. Re-explaining what the reader knows

> Yeah, you're right, this works around the issue rather than fixing it. The real fix is in `MergeService`: when we move a child under a new parent, it should update `pipeline_id` along with `parent_id`. We can backfill the bad rows from the audit log with `Change.where(field: "pipeline_id", source: "merge")`. I checked QA: 123 past merges, only 6 rows wrong now, so the cleanup is small.
>
> Since `MergeService` is shared and not specific to this account, I'd rather open a separate ticket than widen this PR. The fallback here is fine to keep until then.
>
> **After:** Agreed, this is a workaround. The proper fix is in `MergeService`, which is shared code, so it would widen this PR past this account and needs a backfill for the rows that are already wrong.
>
> I'd rather keep this PR account specific and open a separate ticket for the `MergeService` fix and the backfill. Let me know if that works.

The diagnosis, the query, and the QA counts move to the ticket.
