// This function will run when the whole page is loaded, ensuring all HTML elements are ready.
document.addEventListener('DOMContentLoaded', () => {

    // --- GRAB HTML ELEMENTS ---
    // We need to get references to all the interactive parts of our HTML page.
    // We find them by the 'id' we gave them in the HTML file.
    const generateBtn = document.getElementById('generate-btn');
    const resultContainer = document.getElementById('result-container');
    const resultText = document.getElementById('result-text');
    const companyDomainInput = document.getElementById('company-domain');
    const firstNamesInput = document.getElementById('first-names');
    const jobTitlesInput = document.getElementById('job-titles');
    const screenshotInput = document.getElementById('screenshot');
    const screenshotArea = document.getElementById('screenshot-area');
    const screenshotPlaceholder = document.getElementById('screenshot-placeholder');
    const screenshotPreview = document.getElementById('screenshot-preview');

    // --- CONFIGURATION ---
    // The API key is now securely stored on the server side.
    // This app will call our secure API endpoint instead of Google directly. 
    
    // FIXED: The backticks (`) inside the prompt have been "escaped" with a backslash (\)
    // so that JavaScript reads the entire prompt as a single block of text.
    const SYSTEM_PROMPT_TEMPLATE = `**Role:** You are an expert new-business Account Executive (AE) named Gage, specializing in selling Sprout Social. Your goal is to write compelling, personalized, and *casual* cold outbound emails to prospects based on **verifiable, real-world information**. **Your writing style should be concise, direct, friendly, and sound like a real human quickly dashing off a note, not like a polished marketing template.**

**Context:**
* **Product:** Sprout Social is a comprehensive social media management platform. It helps businesses manage social media publishing, engagement, analytics, social listening, and influencer marketing. Key benefits include improving brand presence, increasing audience engagement, streamlining workflows, making data-driven marketing decisions, proving ROI, and improving team efficiency.
* **Objective:** Draft a cold outbound email to initiate contact and pique the prospect's interest in learning more about Sprout Social.
* **Inputs:** You will receive:
    * A list of prospect first names (\`{{prospect_names}}\`).
    * A corresponding list of prospect job roles (\`{{prospect_roles}}\`). *(Ensure the order matches the names)*.
    * The single company domain or name (\`{{company_name}}\`).
    * **Optionally:** Information derived from a provided screenshot of a recent company social media post or announcement (\`{{screenshot_content_summary}}\`).

**Instructions:**
1.  Receive the lists \`{{prospect_names}}\`, \`{{prospect_roles}}\`, the \`{{company_name}}\`, and check if \`{{screenshot_content_summary}}\` is provided. Determine the total number of prospects (\`N\`). **Note: Perform recency checks relative to the actual current date when this prompt is run.**
2.  **Gather strictly current/future AND verifiable unique findings with sources:**
    * **ABSOLUTE CRITICAL REQUIREMENT:** Your primary goal here is to find **verifiable, real-world information ONLY from reliable sources (the MANDATORY web search tool, or the provided screenshot).** **DO NOT, under ANY circumstances, invent, simulate, fabricate, or hallucinate** any news, events, announcements, source URLs, or other details. Accuracy, truthfulness, and reliance on *actual tool output* are paramount. If absolutely no verifiable information can be found *using the provided tools*, you MUST indicate this explicitly later. **Simulating information is a critical failure.**
    * Initialize \`findings_assignments\` list to hold \`N\` items.
    * Let \`num_web_research_needed = N\`.
    * A list \`valid_findings_pool\` will store verified current/future finding pairs: \`(finding_summary, source_identifier)\`.
    * **If \`{{screenshot_content_summary}}\` IS provided:**
        * *(Assume screenshot is inherently current and real)* Add the pair (\`{{screenshot_content_summary}}\`, "Screenshot") to \`valid_findings_pool\`.
        * Decrement \`num_web_research_needed\` by 1.
    * **Perform MANDATORY Web Research using Tools:**
        * **You MUST use the available web search tool** to find \`num_web_research_needed\` additional *specific, distinct* pieces of information about \`{{company_name}}\`. This step is not optional.
        * **Try multiple search query variations** (e.g., searching for \`{{company_name}}\` combined with terms like "news", "press release", "recent announcement", "product launch", "partnership", "event", "blog update") to maximize the chance of finding relevant items *via the tool*. **Actively seek out several potential findings from the tool's results** before proceeding to filtering.
        * **Source Verification:** **ALL findings MUST originate *directly* from the specific results returned by the web search tool.** The \`finding_summary\` must be based *only* on the content provided by the tool for a specific result, and the \`source_url\` MUST be the *exact URL provided by the tool* for that result. **DO NOT create, modify, or assume any information not explicitly present in the tool's output.**
        * **Strict Date Check:** For each potential finding identified *via the web search tool*, **verify its date based on the information from the tool.** It **MUST** be dated within approximately the **last 30 days** relative to the current date OR clearly refer to a **future date/event/plan.** Findings older than approximately **one month** are **unacceptable.**
        * **Reality Check (Tool Output Only):** Confirm the finding originates *directly* from a specific result returned by the search tool. You MUST NOT synthesize information or create findings that are not explicitly present in the tool's output. Record the *exact* \`source_url\` provided by the tool for this finding. **Under NO circumstances should you invent a finding or source URL if the search tool does not provide one.**
        * **Filtering:** If a potential finding extracted *directly from the tool's output* passes BOTH date and reality checks AND is distinct from items already in \`valid_findings_pool\`, add the pair (\`finding_summary\`, \`source_url\`) to \`valid_findings_pool\`. Continue searching (potentially trying more query variations if needed) until \`num_web_research_needed\` valid, distinct items are found OR reasonable search efforts using the tool are exhausted.
    * **Confirm Tool Usage:** Verify that the web search tool was successfully called and that any potential findings listed were extracted *directly* from the tool's output. If the tool failed, returned no results, or returned no *relevant* results (after filtering) despite trying multiple queries, the pool of web-based findings (\`valid_findings_pool\` excluding screenshot info) will be empty or smaller than \`num_web_research_needed\`. Proceed based on the *actual* findings retrieved.
    * **Web Research Guidance:** Look for things like: an upcoming or very recent (last ~4 weeks) event, initiative, or product launch; recently published (last ~4 weeks) content or campaign; a significant company announcement from the last ~4 weeks or regarding future plans – **as reported by the search tool.**
    * **Handle Finding Assignment (Prioritize Reality & Recency, Reuse Required):**
        * Determine \`valid_findings_found = len(valid_findings_pool)\`.
        * **If \`valid_findings_found == 0\` (meaning NEITHER the screenshot NOR the mandatory web search yielded any verifiable current info):** Assign the status "ERROR: No verifiable current info found via tools" to all \`N\` slots in \`findings_assignments\`. *(Stop processing for email generation in this case)*.
        * **If \`0 < valid_findings_found <= N\`:**
            * Assign the finding pairs from \`valid_findings_pool\` (which *only* contain real, tool-verified/screenshot data) to the first \`valid_findings_found\` slots in \`findings_assignments\`.
            * For the remaining \`N - valid_findings_found\` slots (if any), **reuse** the most significant finding pair(s) from \`valid_findings_pool\` to fill these slots. Ensure every slot in \`findings_assignments\` contains a real, verified, current/future finding pair sourced *only* from the tool or screenshot. **Strict reality and recency based on tool/screenshot evidence are the absolute priorities.** Reuse finding pairs as needed.
    * *Result: You now have the \`findings_assignments\` list of length \`N\`. Each slot contains either a strictly current/future verifiable finding pair \`(summary, source)\` (sourced ONLY from the tool or screenshot, appropriately reused) OR potentially the 'ERROR' status.*
3.  **Assign findings and identify pain points:**
    * **Assign Findings:** The \`findings_assignments\` list from Step 2 now directly maps finding pairs \`(summary, source)\` (or the 'ERROR' status) to each prospect positionally.
    * **Identify Pain Point/Objective:** For EACH prospect, consider their \`{{prospect_role}}\`. Identify a common pain point OR a key objective relevant to that prospect's likely focus, considering their industry and specific role. *(Done even if an ERROR status occurred)*. Examples:
        * For leadership roles (like Heads of Marketing, VPs): Focus on ROI, reporting, team efficiency, competitive benchmarking, brand reputation.
        * For manager roles (like Social Media Managers): Focus on saving time, simplifying workflows, content scheduling, easier engagement, campaign tracking.
        * **Tailor this to the industry (e.g., E-commerce & Retail: Driving sales, product promotion, CAC/ROAS tracking, customer review management; Healthcare: Building trust, patient education, HIPAA compliance, information accuracy; Finance & Banking: Building trust, customer service, Regulatory compliance (SEC/FINRA), data security; B2B / Professional Services (incl. Law): Lead generation, thought leadership, Employee advocacy participation, demonstrating ROI; Sports & Entertainment: Fan engagement, ticket/merch sales, Real-time updates, managing fan expectations; Travel & Hospitality: Inspiring travel, driving bookings, High-quality visuals, reputation management; Technology (SaaS & Hardware): Lead generation (demos/trials), product education, Communicating complexity, user support; Non-profit & Advocacy: Cause awareness, donations/action, Demonstrating impact, mobilizing community; Food & Beverage: Driving traffic/orders, visual appeal, Managing reviews, encouraging UGC; Automotive: Brand awareness, lead generation (test drives), Supporting dealers, visual content quality; Fashion & Beauty: Visual product discovery, influencer marketing, Driving sales, maintaining brand aesthetic; Real Estate: Showcasing listings, lead generation, Hyper-local targeting, regulatory compliance; ).**
4.  **Draft email components:**
    * For EACH prospect (index \`i\` from 0 to N-1):
    * **Check Finding Status:** Look at \`findings_assignments[i]\`. Let \`assigned_item = findings_assignments[i]\`.
    * **If \`assigned_item\` is 'ERROR: No verifiable current info found via tools':**
        * Skip email generation for this prospect. Make a note to report the error. Continue to the next prospect.
    * **If \`assigned_item\` contains a real finding pair \`(summary, source)\`:**
        * **Generate Specific Subject:** Create a clever, casual subject line relevant to the \`summary\`. Use a casual style (e.g., lowercase/sentence case).
        * **Plan Specific Email Body:** Prepare to draft the full email body following Steps 5, 6, and 7, including the specific opener (Step 6a) based on the \`summary\`.
    * **Email Body Style Guidance:** **Strictly avoid common business jargon (like 'streamline', 'leverage', 'synergize', 'optimize', 'utilize', etc.). Focus on simple, direct language. Keep the language natural and conversational.** Use minor typos occasionally to help with the human aspect.
5.  **Keep EACH email body concise: strictly under 100 words.**
6.  **Construct EACH email body (if not skipped due to ERROR):**
    * **(a) Opener:** Start with a line *directly referencing the \`summary\` from the specific, verified finding assigned* to that prospect. Make it timely and observant.
    * **(b) Value Proposition (as Question):** Instead of stating a direct benefit, **reframe the connection as an insightful or challenging question** related to the pain point/objective identified for *their specific role* (Step 3b). The question should make them consider a common difficulty or goal related to their role, subtly hinting at how Sprout Social could help. **Remember to keep the question's language natural and avoid the forbidden jargon mentioned in Step 4.** Examples:
        * *(For a VP, connecting to ROI/reporting):* 'Given [Reference to Opener News/Context], how are you approaching tracking the ROI across all those different channels?' or 'Does getting a clear picture of ROI from initiatives like [Opener News] present any challenges for your team?'
        * *(For an SM Manager, connecting to workflow/scheduling):* 'With [Opener News] happening, is scheduling and coordinating all the related social content across platforms proving tricky?' or 'As the one managing social day-to-day, how much time does coordinating posts for things like [Opener News] usually take?'
    * **(c) Connecting Statement / Social Proof:** Briefly add a **social proof statement** connecting your experience to the challenge posed in the question (6b). **Reference either the prospect's specific \`{{prospect_role}}\` OR their industry (derived from \`{{company_name}}\` context or Step 3b's tailoring).** Keep this statement concise and natural, avoiding jargon. Examples: 'I've actually worked with other **VPs** facing similar ROI tracking questions.', 'That kind of coordination is something I hear a lot from **social managers**, especially in the **legal sector**.', 'We've helped several **marketing teams in apparel** get a better handle on measuring campaign impact with Sprout Social.'
    * **(d) Call to Action:** End with a simple, low-pressure call to action that **explicitly mentions Sprout Social**. **Crucially, ensure this CTA also avoids the forbidden jargon mentioned in Step 4 (like 'streamline'). Keep it natural and direct.** Examples: 'Curious to learn how Sprout Social might help with that?', 'Open to a quick chat about how Sprout Social tackles [related pain point]?', 'Worth exploring if Sprout Social could make [related task] easier at {{company_name}}?'
    * Maintain a friendly, helpful, and casual tone throughout.
7.  **Sign off:** Always sign each email body simply as 'Gage'.
8.  **Output:**
    * Initialize an empty dictionary \`source_tracker\` to map sources to the first prospect index they were used for.
    * For each prospect (index \`i\`) where an email was successfully generated (i.e., finding status was not 'ERROR'):
        * Retrieve the assigned finding pair: \`(summary, source) = findings_assignments[i]\`.
        * **Output Source Info:**
            * If \`source\` is already in \`source_tracker\`:
                * Output the text: \`Source: Same as for Prospect #\${source_tracker[source] + 1}\` (This line should NOT be in a code snippet).
            * Else (\`source\` is new):
                * Add \`source\` to \`source_tracker\` with value \`i\`.
                * If \`source == "Screenshot"\`:
                    * Output the text: \`Source: Provided Screenshot\` (This line should NOT be in a code snippet).
                * Else (\`source\` is a URL):
                    * Output the text: \`Source: \${source}\` (Output the URL directly. This line should NOT be in a code snippet).
        * **Output Subject:** Output the generated subject line, enclosed in its own markdown code snippet (\`\`\`).
        * **Output Body:** Output the generated email body, enclosed in its own separate markdown code snippet (\`\`\`) immediately following the subject line snippet.
    * If the 'ERROR: No verifiable current info found via tools' status occurred for any prospect(s), explicitly state this error message clearly at the end of the output.

**Example Input Variables:**
* \`{{prospect_names}}\`: ["Alice", "Bob", "Charlie"]
* \`{{prospect_roles}}\`: ["Marketing Director", "Events Manager", "VP Sales"]
* \`{{company_name}}\`: "Example Corp"
* \`{{screenshot_content_summary}}\`: "Example Corp's recent Instagram post announcing their upcoming sponsorship of the downtown marathon."

*(Note: In this example, if only one additional web finding (e.g., ('New product launch next month', 'http://example.com/news/123')) was verified *by the tool*, the marathon info (Source: Provided Screenshot) might be used for Alice, and the product launch (Source: http://example.com/news/123) might be used for Bob and Charlie. Charlie's output would indicate 'Source: Same as for Prospect #2'.)*`;




    // --- EVENT LISTENER ---
    // This tells the "Generate Email" button to listen for a click.
    generateBtn.addEventListener('click', async () => {
        
        // Check if this is the "Let's do another!" button
        if (generateBtn.innerText === "Let's do another!") {
            window.location.reload();
            return;
        }
        
        // --- 1. GATHER USER INPUT ---
        const companyDomain = companyDomainInput.value.trim();
        const firstNames = firstNamesInput.value.trim();
        const jobTitles = jobTitlesInput.value.trim();
        const imageFile = currentImageFile;

        // Basic validation
        if (!companyDomain || !firstNames || !jobTitles) {
            resultText.innerText = 'Please fill out all required fields: Company Domain, Prospect Name(s), and Job Title(s).';
            resultContainer.classList.remove('hidden');
            return;
        }

        // --- 2. PREPARE FOR API CALL ---
        resultContainer.classList.remove('hidden');
        
        // Fun loading messages
        const loadingMessages = [
            "Tomer please hire me...",
            "I heard Gage can close business...",
            "Convincing Gemini to stop hallucinating...",
            "Teaching AI to write like a human...",
            "Sprout Social, please notice us...",
            "Making emails that don't sound like robots...",
            "Gage's charm is being encoded...",
            "Converting caffeine to code...",
            "Asking Gemini nicely to cooperate...",
            "Channeling Gage's sales energy...",
            "Making sure the AI doesn't make stuff up...",
            "Sprout Social, we're coming for you...",
            "Gage's closing skills being uploaded...",
            "Teaching AI the art of the cold email...",
            "Making emails that actually get responses..."
        ];
        
        let messageIndex = 0;
        const updateLoadingMessage = () => {
            resultText.innerText = loadingMessages[messageIndex];
            messageIndex = (messageIndex + 1) % loadingMessages.length;
        };
        
        updateLoadingMessage();
        const messageInterval = setInterval(updateLoadingMessage, 2000);
        
        generateBtn.disabled = true;
        generateBtn.innerText = 'Generating...';
        generateBtn.classList.remove('bg-blue-600', 'hover:bg-blue-700');
        generateBtn.classList.add('bg-gray-600', 'cursor-not-allowed');
        
        // --- 3. TWO-STEP APPROACH: First web search, then email generation ---
        
        // Step 1: Simple web search to get current company info
        const searchPrompt = `Find the 3 most recent and relevant pieces of information about ${companyDomain}. Focus on:
        - Recent news, announcements, or press releases
        - Product launches or updates
        - Earnings reports or financial news
        - Upcoming events or conferences
        
        Return only the most current and relevant information in a concise format.`;
        
        console.log("Step 1: Performing web search...");
        
        const searchPayload = {
            contents: [{
                role: "user",
                parts: [{ text: searchPrompt }]
            }],
            generationConfig: {
                "temperature": 0.3,
                "topP": 1,
                "topK": 1,
            },
            tools: [
                {
                    "google_search": {}
                }
            ]
        };
        
        // --- 4. TWO-STEP API CALLS ---
        try {
            // Step 1: Web search
            console.log("Making web search API call...");
            const searchResponse = await fetch('/api/gemini', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(searchPayload)
            });

            if (!searchResponse.ok) {
                const errorData = await searchResponse.json();
                console.error("Search API Error Response:", errorData);
                throw new Error(`Search API Error: ${searchResponse.status} ${searchResponse.statusText}`);
            }

            const searchData = await searchResponse.json();
            console.log("Web search response:", searchData);
            
            let companyInfo = "No recent information found.";
            let searchMetadata = null;
            let sourceUrls = [];
            
            if (searchData.candidates && searchData.candidates.length > 0) {
                const searchCandidate = searchData.candidates[0];
                if (searchCandidate.content && searchCandidate.content.parts && searchCandidate.content.parts[0]) {
                    companyInfo = searchCandidate.content.parts[0].text;
                }
                searchMetadata = searchCandidate.groundingMetadata;
                
                // Extract source URLs if available
                if (searchMetadata && searchMetadata.groundingChunks) {
                    searchMetadata.groundingChunks.forEach(chunk => {
                        if (chunk.web && chunk.web.uri) {
                            sourceUrls.push({
                                url: chunk.web.uri,
                                title: chunk.web.title || 'Source'
                            });
                        }
                    });
                }
            }
            
            console.log("Company info found:", companyInfo);
            
            // Step 2: Generate emails using the found information
            console.log("Step 2: Generating emails...");
            
            const emailPrompt = `Based on this current information about ${companyDomain}:

${companyInfo}

Generate personalized cold outbound emails for these prospects:
- Names: ${firstNames}
- Job titles: ${jobTitles}

Follow these guidelines:
1. Use the current company information above
2. Create 2 emails (one for each prospect)
3. Keep each email under 100 words
4. Make them casual and human-sounding
5. Reference specific details from the company info
6. Sign each email as "Gage"

Format the output as:
### **Prospect #1: [name], [title]**
Source: [relevant source from the info above]

\`\`\`
[subject line]
\`\`\`

\`\`\`
[email body]
\`\`\`

### **Prospect #2: [name], [title]**
[repeat format]`;

            const emailPayload = {
                contents: [{
                    role: "user",
                    parts: [{ text: emailPrompt }]
                }],
                generationConfig: {
                    "temperature": 0.7,
                    "topP": 1,
                    "topK": 1,
                }
            };

            // Step 2: Generate emails
            const emailResponse = await fetch('/api/gemini', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(emailPayload)
            });

            if (!emailResponse.ok) {
                const errorData = await emailResponse.json();
                console.error("Email API Error Response:", errorData);
                throw new Error(`Email API Error: ${emailResponse.status} ${emailResponse.statusText}`);
            }

            const emailData = await emailResponse.json();
            console.log("Email generation response:", emailData);
            
            if (emailData.candidates && emailData.candidates.length > 0) {
                const candidate = emailData.candidates[0];
                
                // Check if the response structure is valid
                if (!candidate.content || !candidate.content.parts || !candidate.content.parts[0]) {
                    console.error("Invalid candidate structure:", candidate);
                    resultText.innerText = "Received an invalid response structure from the API. Check the console for details.";
                    return;
                }
                
                const emailText = candidate.content.parts[0].text;
                let displayText = emailText;
                
                // Add web search info if available
                if (searchMetadata) {
                    console.log("✅ Web search was performed!");
                    console.log("Search queries:", searchMetadata.webSearchQueries);
                    
                    displayText += "\n\n--- WEB SEARCH RESULTS ---\n";
                    displayText += `✅ Web search was performed successfully\n`;
                    displayText += `🔍 Search queries used: ${searchMetadata.webSearchQueries.join(", ")}\n`;
                    displayText += `📚 Company info found: ${companyInfo.substring(0, 200)}...\n`;
                    
                    // Add source links if available
                    if (sourceUrls.length > 0) {
                        displayText += `\n🔗 Sources:\n`;
                        sourceUrls.forEach((source, index) => {
                            displayText += `${index + 1}. <a href="${source.url}" target="_blank" class="text-blue-400 hover:text-blue-300 underline">${source.title}</a>\n`;
                        });
                    }
                } else {
                    displayText += "\n\n--- WEB SEARCH STATUS ---\n";
                    displayText += `❌ No web search metadata found\n`;
                }
                
                resultText.innerHTML = displayText;
            } else {
                console.error("Invalid response structure from API:", emailData);
                resultText.innerText = "Received an unexpected response from the API. The 'candidates' field is missing. Check the console for details.";
            }

        } catch (error) {
            console.error('Error fetching from Gemini API:', error);
            resultText.innerText = `An error occurred. Please check the console for details. (This usually happens if the API key is invalid or the API is busy).`;
        } finally {
            clearInterval(messageInterval);
            generateBtn.disabled = false;
            generateBtn.innerText = "Let's do another!";
            generateBtn.classList.remove('bg-gray-600', 'cursor-not-allowed');
            generateBtn.classList.add('bg-green-600', 'hover:bg-green-700');
        }
    });

    // --- SCREENSHOT HANDLING ---
    let currentImageFile = null;

    // Handle file upload via click
    screenshotArea.addEventListener('click', () => {
        screenshotInput.click();
    });





    // Handle file selection
    screenshotInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            handleImageFile(file);
        }
    });

    // Handle paste events
    document.addEventListener('paste', (e) => {
        const items = e.clipboardData?.items;
        if (items) {
            for (let item of items) {
                if (item.type.indexOf('image') !== -1) {
                    const file = item.getAsFile();
                    if (file) {
                        handleImageFile(file);
                        break;
                    }
                }
            }
        }
    });

    // Handle image file (from upload or paste)
    function handleImageFile(file) {
        currentImageFile = file;
        
        // Show preview
        const reader = new FileReader();
        reader.onload = (e) => {
            screenshotPreview.src = e.target.result;
            screenshotPreview.classList.remove('hidden');
            screenshotPlaceholder.classList.add('hidden');
        };
        reader.readAsDataURL(file);
    }

    // --- HELPER FUNCTION ---
    // This converts the image file to a base64 string for the API call.
    const toBase64 = file => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = error => reject(error);
    });
});
