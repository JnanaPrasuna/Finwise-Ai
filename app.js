// ==========================================================================
// FinWise AI Client Application Logic
// Handles tab navigation, interactive forms, calculators, charts, and API integrations.
// ==========================================================================

document.addEventListener("DOMContentLoaded", () => {
    // Local State Caches
    let applications = [];
    let activeSettings = {
        anthropic_api_key: "",
        spreadsheet_id: "",
        google_credentials_json: ""
    };

    // ----------------------------------------------------------------------
    // Web Audio Synthesized Sound Engine
    // ----------------------------------------------------------------------
    const AudioEngine = {
        ctx: null,
        init() {
            if (!this.ctx) {
                this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            }
            if (this.ctx.state === "suspended") {
                this.ctx.resume();
            }
        },
        play(type) {
            try {
                this.init();
                const now = this.ctx.currentTime;
                
                if (type === "navClick") {
                    // Modern sky-blue chime for navbar navigation
                    const f1 = 659.25; // E5
                    const f2 = 880;    // A5
                    
                    const osc1 = this.ctx.createOscillator();
                    const osc2 = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    
                    osc1.type = "sine";
                    osc2.type = "sine";
                    
                    osc1.frequency.setValueAtTime(f1, now);
                    osc2.frequency.setValueAtTime(f2, now + 0.05);
                    
                    gain.gain.setValueAtTime(0.04, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
                    
                    osc1.connect(gain);
                    osc2.connect(gain);
                    gain.connect(this.ctx.destination);
                    
                    osc1.start(now);
                    osc1.stop(now + 0.25);
                    osc2.start(now + 0.05);
                    osc2.stop(now + 0.25);
                    
                } else if (type === "cardHover") {
                    // Very soft digital shimmer for card touching
                    const frequencies = [1200, 1500, 1800];
                    frequencies.forEach((f, i) => {
                        const osc = this.ctx.createOscillator();
                        const gain = this.ctx.createGain();
                        
                        osc.type = "sine";
                        osc.frequency.setValueAtTime(f, now + i * 0.02);
                        
                        gain.gain.setValueAtTime(0.005, now + i * 0.02);
                        gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.02 + 0.08);
                        
                        osc.connect(gain);
                        gain.connect(this.ctx.destination);
                        
                        osc.start(now + i * 0.02);
                        osc.stop(now + i * 0.02 + 0.09);
                    });
                    
                } else if (type === "valueSetting") {
                    // Soft woodblock/mechanical micro-click for settings/inputs
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    
                    osc.type = "triangle";
                    osc.frequency.setValueAtTime(800, now);
                    osc.frequency.exponentialRampToValueAtTime(300, now + 0.02);
                    
                    gain.gain.setValueAtTime(0.05, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);
                    
                    osc.connect(gain);
                    gain.connect(this.ctx.destination);
                    
                    osc.start(now);
                    osc.stop(now + 0.025);
                    
                } else if (type === "inputFocus") {
                    // Ultra quiet focus swoosh
                    const osc = this.ctx.createOscillator();
                    const gain = this.ctx.createGain();
                    
                    osc.type = "sine";
                    osc.frequency.setValueAtTime(300, now);
                    osc.frequency.exponentialRampToValueAtTime(450, now + 0.06);
                    
                    gain.gain.setValueAtTime(0.015, now);
                    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);
                    
                    osc.connect(gain);
                    gain.connect(this.ctx.destination);
                    
                    osc.start(now);
                    osc.stop(now + 0.07);
                    
                } else if (type === "success") {
                    // Celestial major upward arpeggio
                    const arpeggio = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
                    arpeggio.forEach((freq, idx) => {
                        const osc = this.ctx.createOscillator();
                        const gain = this.ctx.createGain();
                        osc.type = "sine";
                        osc.frequency.setValueAtTime(freq, now + idx * 0.06);
                        gain.gain.setValueAtTime(0.05, now + idx * 0.06);
                        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.25);
                        osc.connect(gain);
                        gain.connect(this.ctx.destination);
                        osc.start(now + idx * 0.06);
                        osc.stop(now + idx * 0.06 + 0.3);
                    });
                    
                } else if (type === "warning") {
                    // Descending warning chord
                    const chord = [349.23, 293.66, 246.94]; // F4, D4, B3
                    chord.forEach((freq, idx) => {
                        const osc = this.ctx.createOscillator();
                        const gain = this.ctx.createGain();
                        osc.type = "triangle";
                        osc.frequency.setValueAtTime(freq, now + idx * 0.06);
                        gain.gain.setValueAtTime(0.05, now + idx * 0.06);
                        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.3);
                        osc.connect(gain);
                        gain.connect(this.ctx.destination);
                        osc.start(now + idx * 0.06);
                        osc.stop(now + idx * 0.06 + 0.35);
                    });
                }
            } catch (e) {
                console.warn("Web Audio failed to execute:", e);
            }
        }
    };

    // APIs
    const API_APPLICATIONS = "/api/applications";
    const API_CHECK_ELIGIBILITY = "/api/check-eligibility";
    const API_SYNC = "/api/sync";
    const API_TIPS = "/api/ai-tips";
    const API_SETTINGS = "/api/settings";
    const API_RESET = "/api/reset";

    // ----------------------------------------------------------------------
    // Single Page Application (SPA) Tab Routing
    // ----------------------------------------------------------------------
    const navLinks = document.querySelectorAll(".nav-link");
    const sections = document.querySelectorAll(".section");

    navLinks.forEach(link => {
        link.addEventListener("click", (e) => {
            e.preventDefault();
            const target = link.getAttribute("data-target");

            navLinks.forEach(l => l.classList.remove("active"));
            link.classList.add("active");

            sections.forEach(sec => {
                if (sec.id === target) {
                    sec.classList.add("active");
                } else {
                    sec.classList.remove("active");
                }
            });

            // Specific page initializers
            if (target === "calculator") {
                triggerEmiCalculation();
            } else if (target === "analyzer") {
                runCreditAnalysis(parseInt(document.getElementById("analyzer-input-score").value) || 730);
            }
        });
    });

    // Handle redirection buttons
    const btnJumpCreditAnalyzer = document.getElementById("btn-jump-credit-analyzer");
    if (btnJumpCreditAnalyzer) {
        btnJumpCreditAnalyzer.addEventListener("click", () => {
            const appScoreEl = document.getElementById("app-score");
            const score = appScoreEl ? (parseInt(appScoreEl.value) || 620) : 620;
            const analyzerInputEl = document.getElementById("analyzer-input-score");
            if (analyzerInputEl) analyzerInputEl.value = score;
            const analyzerTabEl = document.querySelector('[data-target="analyzer"]');
            if (analyzerTabEl) analyzerTabEl.click();
            runCreditAnalysis(score);
        });
    }

    const btnAdvisorJump = document.getElementById("btn-advisor-jump");
    if (btnAdvisorJump) {
        btnAdvisorJump.addEventListener("click", () => {
            const analyzerInputEl = document.getElementById("analyzer-input-score");
            const score = analyzerInputEl ? (analyzerInputEl.value || 730) : 730;
            const prompt = `How can I improve my credit score from ${score}?`;
            const chatInputEl = document.getElementById("chat-user-input");
            if (chatInputEl) chatInputEl.value = prompt;
            const advisoryTabEl = document.querySelector('[data-target="advisory"]');
            if (advisoryTabEl) advisoryTabEl.click();
            triggerChatConsultation(prompt);
        });
    }

    // ----------------------------------------------------------------------
    // Data Loading & Syncing
    // ----------------------------------------------------------------------
    async function loadInitialData() {
        // 1. Load applications
        try {
            const resApps = await fetch(API_APPLICATIONS);
            if (!resApps.ok) throw new Error("Backend applications load failed");
            applications = await resApps.json();
            // Cache locally
            localStorage.setItem("finwise_applications", JSON.stringify(applications));
        } catch (e) {
            console.warn("Using localStorage fallback for applications logs:", e);
            const cached = localStorage.getItem("finwise_applications");
            if (cached) {
                applications = JSON.parse(cached);
            } else {
                // Seed initial mock data
                applications = [
                    {
                        "timestamp": new Date().toISOString().replace('T', ' ').substring(0, 19),
                        "name": "Prasanna Kumar",
                        "salary": 45000.0,
                        "credit_score": 730,
                        "existing_emi": 0.0,
                        "loan_amount": 900000.0,
                        "status": "Approved",
                        "risk": "Low",
                        "reasoning": [
                            "Application approved based on stable Debt-to-Income (DTI) ratio of 37.6%.",
                            "Your credit score of 730 qualifies you for a competitive rate of 10.5%.",
                            "After meeting all EMIs, you retain a monthly cash reserve of ₹28,099."
                        ],
                        "synced": true
                    },
                    {
                        "timestamp": new Date(Date.now() - 3600000).toISOString().replace('T', ' ').substring(0, 19),
                        "name": "High Risk Applicant",
                        "salary": 22000.0,
                        "credit_score": 620,
                        "existing_emi": 18000.0,
                        "loan_amount": 500000.0,
                        "status": "Rejected",
                        "risk": "High",
                        "reasoning": [
                            "Credit score (620) is below our standard threshold of 630, indicating high default risk.",
                            "High Debt-to-Income (DTI) ratio of 129.26%. Existing and proposed EMIs consume too much of your monthly income."
                        ],
                        "synced": false
                    }
                ];
                localStorage.setItem("finwise_applications", JSON.stringify(applications));
            }
        }
        renderApplicationsDashboard();
        renderApplicationsTable();

        // 2. Load settings
        try {
            const resSettings = await fetch(API_SETTINGS);
            if (resSettings.ok) {
                const fetched = await resSettings.json();
                if (fetched.anthropic_api_key) activeSettings.anthropic_api_key = fetched.anthropic_api_key;
                if (fetched.spreadsheet_id) activeSettings.spreadsheet_id = fetched.spreadsheet_id;
                if (fetched.google_credentials_json) activeSettings.google_credentials_json = fetched.google_credentials_json;
            }
        } catch (e) {
            console.warn("Using default demo settings:", e);
        }
        populateSettingsForm();
    }

    loadInitialData();

    function showToast(message, type = "success") {
        const toast = document.getElementById("toast-notification");
        const msg = document.getElementById("toast-message");
        msg.textContent = message;
        
        toast.className = `toast show ${type}`;
        setTimeout(() => {
            toast.classList.remove("show");
        }, 4000);
    }

    // ----------------------------------------------------------------------
    // KPI Calculations & Table Rendering
    // ----------------------------------------------------------------------
    function renderApplicationsDashboard() {
        const total = applications.length;
        document.getElementById("stat-total-apps").textContent = total;

        const approvedList = applications.filter(a => a.status === "Approved");
        const avgAmt = approvedList.length > 0 
            ? Math.round(approvedList.reduce((sum, a) => sum + a.loan_amount, 0) / approvedList.length)
            : 0;
        document.getElementById("stat-avg-loan").textContent = `₹${avgAmt.toLocaleString("en-IN")}`;

        const highRiskCount = applications.filter(a => a.risk === "High").length;
        const riskRatio = total > 0 ? Math.round((highRiskCount / total) * 100) : 0;
        document.getElementById("stat-high-risk").textContent = `${riskRatio}%`;

        const syncedCount = applications.filter(a => a.synced).length;
        const syncRatio = total > 0 ? Math.round((syncedCount / total) * 100) : 0;
        document.getElementById("stat-sync-rate").textContent = `${syncRatio}%`;
        
        // Update ticker elements
        const tickerStatus = document.getElementById("ticker-sync-status");
        if (tickerStatus) {
            if (total === syncedCount) {
                tickerStatus.textContent = "Synced";
                tickerStatus.className = "ticker-price status-green";
            } else {
                tickerStatus.textContent = `${total - syncedCount} Unsynced`;
                tickerStatus.className = "ticker-price status-amber";
            }
        }
        
        document.getElementById("admin-unsynced-count").textContent = total - syncedCount;
    }

    function renderApplicationsTable() {
        const tbody = document.querySelector("#admin-applications-table tbody");
        tbody.innerHTML = "";
        
        if (applications.length === 0) {
            tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; color:var(--text-muted);">No loan evaluations registered.</td></tr>`;
            return;
        }

        applications.forEach(app => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${app.timestamp}</td>
                <td style="font-weight:600; color:var(--text-primary);">${app.name}</td>
                <td>₹${app.salary.toLocaleString("en-IN")}</td>
                <td><span class="badge score-${getScoreClass(app.credit_score)}">${app.credit_score}</span></td>
                <td>₹${app.existing_emi.toLocaleString("en-IN")}</td>
                <td>₹${app.loan_amount.toLocaleString("en-IN")}</td>
                <td><span class="status-pill ${app.status === "Approved" ? "approved" : "rejected"}" style="float:none; display:inline-block;">${app.status}</span></td>
                <td><span class="risk-val-text risk-${app.risk.toLowerCase()}">${app.risk}</span></td>
                <td><span class="sync-icon ${app.synced ? "sync-yes" : "sync-no"}">${app.synced ? "🟢 Synced" : "🔴 Pending"}</span></td>
            `;
            tbody.appendChild(tr);
        });
    }

    function getScoreClass(score) {
        if (score >= 750) return "excellent";
        if (score >= 700) return "good";
        if (score >= 630) return "fair";
        return "poor";
    }

    // Add extra tiny CSS styles for badges dynamically
    const styleSheet = document.createElement("style");
    styleSheet.innerText = `
        .badge { padding: 2px 8px; border-radius: 4px; font-weight:700; font-size:0.8rem; font-family: 'Orbitron'; }
        .score-excellent { background: rgba(16, 185, 129, 0.15); color: #10b981; border: 1px solid rgba(16,185,129,0.3); }
        .score-good { background: rgba(56, 189, 248, 0.15); color: #38bdf8; border: 1px solid rgba(56,189,248,0.3); }
        .score-fair { background: rgba(245, 158, 11, 0.15); color: #f59e0b; border: 1px solid rgba(245,158,11,0.3); }
        .score-poor { background: rgba(244, 63, 94, 0.15); color: #f43f5e; border: 1px solid rgba(244,63,94,0.3); }
        .risk-val-text { font-weight:700; }
        .risk-low { color: #10b981; }
        .risk-medium { color: #f59e0b; }
        .risk-high { color: #f43f5e; }
        .sync-yes { color: #10b981; font-weight: 500; }
        .sync-no { color: #f59e0b; font-weight: 500; }
    `;
    document.head.appendChild(styleSheet);

    // Populate Settings configuration
    function populateSettingsForm() {
        document.getElementById("settings-api-key").value = activeSettings.anthropic_api_key || "";
        document.getElementById("settings-sheet-id").value = activeSettings.spreadsheet_id || "";
        document.getElementById("settings-creds-json").value = activeSettings.google_credentials_json || "";
    }

    // ----------------------------------------------------------------------
    // Loan Checker Form Evaluation Handler
    // ----------------------------------------------------------------------
    const loanForm = document.getElementById("loan-eligibility-form");
    loanForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const payload = {
            name: document.getElementById("app-name").value.strip ? document.getElementById("app-name").value.trim() : document.getElementById("app-name").value,
            salary: parseFloat(document.getElementById("app-salary").value),
            credit_score: parseInt(document.getElementById("app-score").value),
            existing_emi: parseFloat(document.getElementById("app-emi").value) || 0,
            loan_amount: parseFloat(document.getElementById("app-loan").value),
            tenure: parseInt(document.getElementById("app-tenure").value)
        };

        const btn = document.getElementById("btn-submit-app");
        btn.disabled = true;
        btn.textContent = "Processing Eligibility Engine...";

        try {
            const res = await fetch(API_CHECK_ELIGIBILITY, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error("Calculation engine error.");
            const data = await res.json();

            // Refresh dashboards
            const resApps = await fetch(API_APPLICATIONS);
            if (resApps.ok) {
                applications = await resApps.json();
                renderApplicationsDashboard();
                renderApplicationsTable();
            }

            renderEligibilityResult(data, payload);
            showToast("Loan evaluation completed successfully!");
        } catch (err) {
            console.error(err);
            showToast("Failed to process loan evaluation.", "error");
        } finally {
            btn.disabled = false;
            btn.textContent = "Evaluate Loan Eligibility";
        }
    });

    function renderEligibilityResult(res, req) {
        const panel = document.getElementById("eligibility-result-panel");
        panel.classList.remove("inactive");

        const isApp = res.status === "Approved";
        panel.className = `card glass-card result-display-card ${isApp ? 'approved-border' : 'rejected-border'}`;

        // Play result sound
        if (isApp) {
            AudioEngine.play("success");
        } else {
            AudioEngine.play("warning");
        }

        // Badge status
        const badge = document.getElementById("result-status-badge");
        badge.textContent = res.status;
        badge.className = `status-pill ${isApp ? 'approved' : 'rejected'}`;

        // Risk rating
        const riskVal = document.getElementById("result-risk-level");
        riskVal.textContent = `${res.risk} RISK`;
        riskVal.className = `risk-value risk-${res.risk.toLowerCase()}`;

        // DTI & details
        document.getElementById("result-dti-ratio").textContent = `${res.dti}%`;
        document.getElementById("result-rate").textContent = `${res.interest_rate}% p.a.`;
        document.getElementById("result-proposed-emi").textContent = `₹${Math.round(res.proposed_emi).toLocaleString("en-IN")}`;
        document.getElementById("result-eligible-amt").textContent = `₹${Math.round(res.eligible_loan).toLocaleString("en-IN")}`;

        // Reasoning
        const rList = document.getElementById("result-reasoning-list");
        rList.innerHTML = "";
        res.reasoning.forEach(r => {
            const li = document.createElement("li");
            li.textContent = r;
            rList.appendChild(li);
        });

        // Toggle alert advisory redirection
        const advBox = document.getElementById("result-rejection-advice");
        if (!isApp) {
            advBox.style.display = "block";
        } else {
            advBox.style.display = "none";
        }
        
        // Scroll to results on mobile screens
        if (window.innerWidth < 900) {
            panel.scrollIntoView({ behavior: 'smooth' });
        }
    }

    // ----------------------------------------------------------------------
    // Credit Score Analyzer Action logic
    // ----------------------------------------------------------------------
    const btnAnalyze = document.getElementById("btn-analyze-score");
    btnAnalyze.addEventListener("click", () => {
        const val = parseInt(document.getElementById("analyzer-input-score").value);
        if (val >= 300 && val <= 850) {
            runCreditAnalysis(val);
        } else {
            showToast("Please enter a valid credit score between 300 and 850.", "error");
        }
    });

    function runCreditAnalysis(score) {
        document.getElementById("analyzer-score-display").textContent = score;

        // Map score 300-850 to gauge angles 0 to 180 degrees
        // (score - 300) / (850 - 300) = fraction
        const fraction = (score - 300) / 550;
        const angle = -90 + (fraction * 180); // Maps -90deg (Poor) to +90deg (Exceptional)
        document.getElementById("gauge-pointer").style.transform = `rotate(${angle}deg)`;

        // Classify tier
        let tier = "";
        let color = "";
        let recs = [];
        let pHist = 50, cUtil = 50, cLen = 50, cMix = 50;

        if (score >= 800) {
            tier = "Exceptional";
            color = "var(--accent-emerald)";
            pHist = 98; cUtil = 95; cLen = 90; cMix = 88;
            recs = [
                "Exceptional risk profile. You qualify automatically for all premier financial products.",
                "Maintain your zero-balance record on secondary credit lines to preserve your FICO rank.",
                "Negotiate premium interest discounts directly with primary bank lenders."
            ];
        } else if (score >= 740) {
            tier = "Very Good";
            color = "var(--accent-sky)";
            pHist = 90; cUtil = 85; cLen = 78; cMix = 72;
            recs = [
                "Solid repayment behavior. Continue paying balances prior to statement dates.",
                "Keep older accounts open to maintain average credit account longevity.",
                "Review credit reports annually to audit query logs and verify validity."
            ];
        } else if (score >= 670) {
            tier = "Good";
            color = "#eab308";
            pHist = 80; cUtil = 72; cLen = 65; cMix = 60;
            recs = [
                "Good FICO score. You represent a standard reliable borrower.",
                "Aim to drop card utilization below 30% to increase points further.",
                "Restrict requests for retail credit cards or short-term personal lines."
            ];
        } else if (score >= 580) {
            tier = "Fair";
            color = "var(--accent-amber)";
            pHist = 65; cUtil = 45; cLen = 50; cMix = 48;
            recs = [
                "Fair score showing potential risks. Action plan is highly recommended.",
                "Set up automated autopay alerts for card bills to eliminate occasional defaults.",
                "Consider paying card balances down twice a month to artificially lower reported utilization.",
                "Avoid launching any new credit inquiries in the next 6 months."
            ];
        } else {
            tier = "Poor";
            color = "var(--accent-rose)";
            pHist = 40; cUtil = 20; cLen = 30; cMix = 35;
            recs = [
                "Poor rating. High eligibility rejection risks on standard lines.",
                "Prioritize clearing any default alerts, settlement markings, or active collection issues.",
                "Secure a 'Secured Credit Card' backed by a fixed deposit to safely re-establish positive payment histories.",
                "Ensure absolutely zero late payments on current active utilities, EMI, or phone bills."
            ];
        }

        const statDisp = document.getElementById("analyzer-status-display");
        statDisp.textContent = tier;
        statDisp.style.color = color;

        // Progress bar updates
        document.getElementById("bar-pay-history").style.width = `${pHist}%`;
        document.getElementById("bar-credit-util").style.width = `${cUtil}%`;
        document.getElementById("bar-credit-len").style.width = `${cLen}%`;
        document.getElementById("bar-credit-mix").style.width = `${cMix}%`;

        // Recommendation lists
        const recList = document.getElementById("analyzer-rec-list");
        recList.innerHTML = "";
        recs.forEach(r => {
            const li = document.createElement("li");
            li.textContent = r;
            recList.appendChild(li);
        });
    }

    // ----------------------------------------------------------------------
    // EMI Calculator Logic with SVG donut update & Amortization
    // ----------------------------------------------------------------------
    const sAmt = document.getElementById("slider-amt");
    const nAmt = document.getElementById("num-amt");
    const sRate = document.getElementById("slider-rate");
    const nRate = document.getElementById("num-rate");
    const sTenure = document.getElementById("slider-tenure");
    const nTenure = document.getElementById("num-tenure");

    // Sync sliders and numbers
    function syncInputs(slider, num, callback) {
        slider.addEventListener("input", () => {
            num.value = slider.value;
            AudioEngine.play("valueSetting");
            callback();
        });
        num.addEventListener("change", () => {
            let val = parseFloat(num.value);
            const min = parseFloat(slider.min);
            const max = parseFloat(slider.max);
            if (val < min) val = min;
            if (val > max) val = max;
            num.value = val;
            slider.value = val;
            AudioEngine.play("valueSetting");
            callback();
        });
    }

    syncInputs(sAmt, nAmt, triggerEmiCalculation);
    syncInputs(sRate, nRate, triggerEmiCalculation);
    syncInputs(sTenure, nTenure, triggerEmiCalculation);

    function triggerEmiCalculation() {
        const principal = parseFloat(nAmt.value) || 500000;
        const rateVal = parseFloat(nRate.value) || 10.5;
        const tenure = parseInt(nTenure.value) || 60;

        const monthlyRate = (rateVal / 100) / 12;
        
        let emi = 0;
        if (monthlyRate > 0) {
            emi = principal * monthlyRate * Math.pow(1 + monthlyRate, tenure) / (Math.pow(1 + monthlyRate, tenure) - 1);
        } else {
            emi = principal / tenure;
        }

        const totalPayable = emi * tenure;
        const totalInterest = totalPayable - principal;

        document.getElementById("emi-monthly-val").textContent = `₹${Math.round(emi).toLocaleString("en-IN")}`;
        document.getElementById("emi-interest-val").textContent = `₹${Math.round(totalInterest).toLocaleString("en-IN")}`;
        document.getElementById("emi-total-val").textContent = `₹${Math.round(totalPayable).toLocaleString("en-IN")}`;

        // Update SVG Chart
        const principalPercent = (principal / totalPayable) * 100;
        const interestPercent = 100 - principalPercent;

        document.getElementById("donut-split-ratio").textContent = `${principalPercent.toFixed(1)}%`;
        
        const pCircle = document.getElementById("emi-pie-principal");
        const iCircle = document.getElementById("emi-pie-interest");

        pCircle.setAttribute("stroke-dasharray", `${principalPercent.toFixed(1)}, 100`);
        iCircle.setAttribute("stroke-dasharray", `${interestPercent.toFixed(1)}, 100`);
        iCircle.setAttribute("stroke-dashoffset", `${-principalPercent.toFixed(1)}`);

        // Update Legend
        const legends = document.querySelector(".donut-legend");
        legends.innerHTML = `
            <div class="legend-item"><span class="legend-dot pass-color"></span> Principal (₹${Math.round(principal).toLocaleString("en-IN")})</div>
            <div class="legend-item"><span class="legend-dot fail-color"></span> Interest (₹${Math.round(totalInterest).toLocaleString("en-IN")})</div>
        `;

        renderAmortizationSchedule(principal, rateVal, tenure, emi);
    }

    function renderAmortizationSchedule(principal, annualRate, tenure, emi) {
        const tbody = document.querySelector("#amortization-table tbody");
        tbody.innerHTML = "";
        
        const monthlyRate = (annualRate / 100) / 12;
        let balance = principal;
        
        // Show first 12 months or all if tenure < 12 to prevent giant DOM slowdown
        const displayLimit = Math.min(tenure, 24);

        for (let m = 1; m <= tenure; m++) {
            const interest = balance * monthlyRate;
            let pComp = emi - interest;
            
            if (m === tenure) {
                pComp = balance; // exact closing
            }

            const closing = balance - pComp;

            if (m <= displayLimit) {
                const tr = document.createElement("tr");
                tr.innerHTML = `
                    <td>Month ${m}</td>
                    <td>₹${Math.round(balance).toLocaleString("en-IN")}</td>
                    <td>₹${Math.round(emi).toLocaleString("en-IN")}</td>
                    <td>₹${Math.round(pComp).toLocaleString("en-IN")}</td>
                    <td>₹${Math.round(interest).toLocaleString("en-IN")}</td>
                    <td>₹${Math.max(0, Math.round(closing)).toLocaleString("en-IN")}</td>
                `;
                tbody.appendChild(tr);
            }
            balance = closing;
        }

        if (tenure > displayLimit) {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td colspan="6" style="text-align:center; color:var(--text-muted);">
                    Showing first ${displayLimit} months. Click Export CSV to view complete ${tenure}-month schedule.
                </td>
            `;
            tbody.appendChild(tr);
        }
    }

    // CSV Amortization Export
    document.getElementById("btn-export-amort").addEventListener("click", () => {
        const principal = parseFloat(nAmt.value) || 500000;
        const rateVal = parseFloat(nRate.value) || 10.5;
        const tenure = parseInt(nTenure.value) || 60;
        const emi = principal * ((rateVal / 100) / 12) * Math.pow(1 + ((rateVal / 100) / 12), tenure) / (Math.pow(1 + ((rateVal / 100) / 12), tenure) - 1);

        let csv = "Month,Opening Balance (INR),EMI Paid (INR),Principal paid (INR),Interest paid (INR),Closing Balance (INR)\n";
        let balance = principal;
        const mRate = (rateVal / 100) / 12;

        for (let m = 1; m <= tenure; m++) {
            const interest = balance * mRate;
            let pComp = emi - interest;
            if (m === tenure) pComp = balance;
            const closing = balance - pComp;

            csv += `${m},${Math.round(balance)},${Math.round(emi)},${Math.round(pComp)},${Math.round(interest)},${Math.max(0, Math.round(closing))}\n`;
            balance = closing;
        }

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.setAttribute("download", `FinWise_Amortization_Schedule_${Math.round(principal)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast("CSV Exported successfully!");
    });

    // ----------------------------------------------------------------------
    // AI Chat Advisor Console logic
    // ----------------------------------------------------------------------
    const btnSend = document.getElementById("btn-send-chat");
    const chatInput = document.getElementById("chat-user-input");
    const chatArea = document.getElementById("chat-conversation-area");

    btnSend.addEventListener("click", () => {
        const query = chatInput.value.strip ? chatInput.value.trim() : chatInput.value;
        if (query.length > 3) {
            triggerChatConsultation(query);
            chatInput.value = "";
        }
    });

    chatInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            btnSend.click();
        }
    });

    // Preset prompts clicking
    const presets = document.querySelectorAll(".preset-btn");
    presets.forEach(p => {
        p.addEventListener("click", () => {
            const q = p.getAttribute("data-query");
            triggerChatConsultation(q);
        });
    });

    // Chatbot Header Actions
    const btnBackToAnalyzerEl = document.getElementById("btn-back-to-analyzer");
    if (btnBackToAnalyzerEl) {
        btnBackToAnalyzerEl.addEventListener("click", () => {
            const analyzerTabEl = document.querySelector('[data-target="analyzer"]');
            if (analyzerTabEl) analyzerTabEl.click();
        });
    }

    const btnClearChatEl = document.getElementById("btn-clear-chat");
    if (btnClearChatEl) {
        btnClearChatEl.addEventListener("click", () => {
            if (chatArea) {
                chatArea.innerHTML = `
                    <div class="chat-bubble bot-bubble">
                        <span class="chat-time">Just Now</span>
                        <h4>👋 Hello! I am FinWise AI, your financial assistant.</h4>
                        <p>Ask me details regarding debt consolidation, mortgage evaluation, FICO improvement, or household budgeting. Tap any quick query or type in your parameters below.</p>
                    </div>
                `;
            }
        });
    }

    async function triggerChatConsultation(query) {
        // Append User Bubble
        const uBubble = document.createElement("div");
        uBubble.className = "chat-bubble user-bubble";
        uBubble.innerHTML = `<span class="chat-time">Just Now</span><p>${escapeHtml(query)}</p>`;
        chatArea.appendChild(uBubble);
        chatArea.scrollTop = chatArea.scrollHeight;

        // Append Bot Loading Bubble
        const lBubble = document.createElement("div");
        lBubble.className = "chat-bubble bot-bubble loading-bubble";
        lBubble.innerHTML = `<div class="spinner"></div><span>Claude is reasoning...</span>`;
        chatArea.appendChild(lBubble);
        chatArea.scrollTop = chatArea.scrollHeight;

        // Extract context parameters
        const score = parseInt(document.getElementById("app-score").value) || null;
        const salary = parseFloat(document.getElementById("app-salary").value) || null;
        const emi = parseFloat(document.getElementById("app-emi").value) || null;

        try {
            const res = await fetch(API_TIPS, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    query: query,
                    credit_score: score,
                    salary: salary,
                    existing_emi: emi
                })
            });

            if (!res.ok) throw new Error("Tips advisory failed.");
            const data = await res.json();

            // Replace loading bubble with bot response bubble
            lBubble.classList.remove("loading-bubble");
            lBubble.innerHTML = `
                <span class="chat-time">${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                ${formatAdvisorAdvice(data.advice)}
            `;
            chatArea.scrollTop = chatArea.scrollHeight;
        } catch (e) {
            console.error(e);
            lBubble.classList.remove("loading-bubble");
            lBubble.innerHTML = `
                <span class="chat-time">Just Now</span>
                <p style="color:var(--accent-rose);">Error: Failed to fetch response from FinWise AI engine. Please ensure your backend server is active.</p>
            `;
        }
    }

    function escapeHtml(text) {
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function formatAdvisorAdvice(rawText) {
        // Parse simple markdown-like elements (e.g. ### Headers, **Bold**, 1. lists)
        let html = rawText;
        
        // Escape HTML first to prevent code execution
        html = escapeHtml(html);

        // Bold tags **text** -> <strong>text</strong>
        html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

        // Headers ### text -> <h3>text</h3>
        html = html.replace(/### (.*?)\n/g, "<h3>$1</h3>");
        html = html.replace(/### (.*?)$/g, "<h3>$1</h3>");

        // Convert lists: replace line breaks with bullets or standard spacing
        html = html.replace(/\n/g, "<br>");
        
        return `<div class="advisor-advice">${html}</div>`;
    }

    // ----------------------------------------------------------------------
    // Admin Credentials Form Submissions
    // ----------------------------------------------------------------------
    const settingsForm = document.getElementById("settings-credentials-form");
    settingsForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const payload = {
            anthropic_api_key: document.getElementById("settings-api-key").value,
            spreadsheet_id: document.getElementById("settings-sheet-id").value,
            google_credentials_json: document.getElementById("settings-creds-json").value
        };

        try {
            const res = await fetch(API_SETTINGS, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error("Failed to save credentials.");
            
            // Reload credentials
            const getSettings = await fetch(API_SETTINGS);
            if (getSettings.ok) {
                activeSettings = await getSettings.json();
                populateSettingsForm();
            }

            showToast("System configurations saved successfully!");
        } catch (err) {
            console.error(err);
            showToast("Failed to save configuration settings.", "error");
        }
    });

    // Sync Database actions
    async function triggerDbSync() {
        const btn = document.getElementById("btn-sync-now");
        const btnAdmin = document.getElementById("btn-admin-sync");
        
        btn.disabled = true;
        btnAdmin.disabled = true;
        btn.textContent = "Syncing...";
        
        try {
            const res = await fetch(API_SYNC, { method: "POST" });
            if (!res.ok) throw new Error("Sync failure.");
            const data = await res.json();
            
            // Reload logs
            const resApps = await fetch(API_APPLICATIONS);
            if (resApps.ok) {
                applications = await resApps.json();
                renderApplicationsDashboard();
                renderApplicationsTable();
            }
            
            if (data.status === "success") {
                showToast(data.message);
            } else {
                showToast(data.message, "info");
            }
        } catch (e) {
            console.error(e);
            showToast("Sync failed. Check Google credentials configuration.", "error");
        } finally {
            btn.disabled = false;
            btnAdmin.disabled = false;
            btn.textContent = "🔄 Sync Sheets";
            btnAdmin.textContent = "🔄 Synchronize Database Now";
        }
    }

    document.getElementById("btn-sync-now").addEventListener("click", triggerDbSync);
    document.getElementById("btn-admin-sync").addEventListener("click", triggerDbSync);

    // Reset database action
    document.getElementById("btn-admin-reset").addEventListener("click", async () => {
        if (confirm("Are you sure you want to delete all application records and reset to initial mock dataset?")) {
            try {
                const res = await fetch(API_RESET, { method: "POST" });
                if (!res.ok) throw new Error("Reset failed.");
                applications = await res.json();
                renderApplicationsDashboard();
                renderApplicationsTable();
                showToast("Applications logs cleared and reset successfully!");
            } catch (e) {
                console.error(e);
                showToast("Reset operations failed.", "error");
            }
        }
    });

    // ----------------------------------------------------------------------
    // Immersive 3D Tilt & Glassmorphic Shine Effects with Body Sparkles
    // ----------------------------------------------------------------------
    function createCardSparkle(pageX, pageY) {
        const sparkle = document.createElement("div");
        sparkle.className = "sparkle";
        sparkle.style.left = `${pageX}px`;
        sparkle.style.top = `${pageY}px`;

        // Random directional offsets for star movement (floats outside bounds)
        const dx = (Math.random() - 0.5) * 110;
        const dy = (Math.random() - 0.5) * 110 - 55; // Float upwards
        const dx2 = dx + (Math.random() - 0.5) * 80;
        const dy2 = dy - 80 - Math.random() * 80;   // Float further upwards

        sparkle.style.setProperty("--dx", `${dx}px`);
        sparkle.style.setProperty("--dy", `${dy}px`);
        sparkle.style.setProperty("--dx2", `${dx2}px`);
        sparkle.style.setProperty("--dy2", `${dy2}px`);

        // Sparkle color presets (white, indigo, sky blue, emerald, amber, purple)
        const colors = ["#ffffff", "#6366f1", "#38bdf8", "#10b981", "#f59e0b", "#a855f7"];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        sparkle.style.background = `radial-gradient(circle, #fff 15%, ${randomColor} 55%, transparent 85%)`;

        document.body.appendChild(sparkle);
        setTimeout(() => sparkle.remove(), 1200);
    }

    function spawnCardBurstSparkles(card) {
        const rect = card.getBoundingClientRect();
        
        // Scale sparkle count dynamically based on card size to distinguish large cards
        let sparkleCount = 16;
        if (rect.width > 600) {
            sparkleCount = 38; // Big cards get a massive shimmering halo
        } else if (rect.width > 350) {
            sparkleCount = 22; // Medium cards
        } else {
            sparkleCount = 12; // Small KPI indicators
        }
        
        // Spawn sparkles scattered around the card perimeter (only once on touch!)
        for (let i = 0; i < sparkleCount; i++) {
            // Pick a random side: 0=top, 1=right, 2=bottom, 3=left
            const side = Math.floor(Math.random() * 4);
            let clientX, clientY;
            
            if (side === 0) { // Top edge
                clientX = rect.left + Math.random() * rect.width;
                clientY = rect.top;
            } else if (side === 1) { // Right edge
                clientX = rect.right;
                clientY = rect.top + Math.random() * rect.height;
            } else if (side === 2) { // Bottom edge
                clientX = rect.left + Math.random() * rect.width;
                clientY = rect.bottom;
            } else { // Left edge
                clientX = rect.left;
                clientY = rect.top + Math.random() * rect.height;
            }
            
            // Push outward from edge randomly
            const angle = Math.random() * Math.PI * 2;
            const distance = 8 + Math.random() * 18;
            clientX += Math.cos(angle) * distance;
            clientY += Math.sin(angle) * distance;
            
            const pageX = window.pageXOffset + clientX;
            const pageY = window.pageYOffset + clientY;
            
            // Cascading sparkle launch (speeds up slightly on larger cards for a clean outline draw)
            setTimeout(() => {
                createCardSparkle(pageX, pageY);
            }, i * (sparkleCount > 30 ? 15 : 25));
        }
    }

    function init3DTilt() {
        const cards = document.querySelectorAll(".glass-card");
        cards.forEach(card => {
            let shine = card.querySelector(".card-shine");
            if (!shine) {
                shine = document.createElement("div");
                shine.className = "card-shine";
                card.appendChild(shine);
            }
            
            // Give springy jump/pop and card-wide perimeter sparkles on mouse enter (only once!)
            card.addEventListener("mouseenter", () => {
                card.style.transition = "transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), background 0.35s ease";
                card.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(-10px) scale(1.025)";
                AudioEngine.play("cardHover");
                spawnCardBurstSparkles(card);
                
                // Continuous card-edge sparkles while cursor is touching
                if (card._sparkleInterval) clearInterval(card._sparkleInterval);
                card._sparkleInterval = setInterval(() => {
                    const rect = card.getBoundingClientRect();
                    const side = Math.floor(Math.random() * 4);
                    let clientX, clientY;
                    if (side === 0) { // Top edge
                        clientX = rect.left + Math.random() * rect.width;
                        clientY = rect.top;
                    } else if (side === 1) { // Right edge
                        clientX = rect.right;
                        clientY = rect.top + Math.random() * rect.height;
                    } else if (side === 2) { // Bottom edge
                        clientX = rect.left + Math.random() * rect.width;
                        clientY = rect.bottom;
                    } else { // Left edge
                        clientX = rect.left;
                        clientY = rect.top + Math.random() * rect.height;
                    }
                    const angle = Math.random() * Math.PI * 2;
                    const distance = 4 + Math.random() * 12;
                    clientX += Math.cos(angle) * distance;
                    clientY += Math.sin(angle) * distance;
                    createCardSparkle(window.pageXOffset + clientX, window.pageYOffset + clientY);
                }, 130);
            });
            
            card.addEventListener("mousemove", (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                
                // Tilt range: max 6 degrees. Minimized to 1.5 degrees for chatbot/large cards.
                let maxTilt = 6;
                if (card.classList.contains("chatbot-card") || rect.width > 600) {
                    maxTilt = 1.5;
                }
                
                const rotateX = ((centerY - y) / centerY) * maxTilt;
                const rotateY = ((x - centerX) / centerX) * maxTilt;
                
                card.style.transition = "none";
                card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-10px) scale(1.025)`;
                
                const shineX = (x / rect.width) * 100;
                const shineY = (y / rect.height) * 100;
                shine.style.background = `radial-gradient(circle at ${shineX}% ${shineY}%, rgba(255, 255, 255, 0.08) 0%, transparent 60%)`;
            });
            
            card.addEventListener("mouseleave", () => {
                card.style.transition = "transform 0.5s cubic-bezier(0.25, 1, 0.5, 1), background 0.35s ease";
                card.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0) scale(1)";
                shine.style.background = "linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, transparent 50%)";
                
                if (card._sparkleInterval) {
                    clearInterval(card._sparkleInterval);
                    card._sparkleInterval = null;
                }
            });
        });
    }

    // ----------------------------------------------------------------------
    // Circular Click Ripple Effects & Sound Triggers
    // ----------------------------------------------------------------------
    document.addEventListener("click", (e) => {
        const target = e.target.closest(".btn, .nav-link, .preset-btn");
        if (target) {
            const computedStyle = window.getComputedStyle(target);
            if (computedStyle.position === "static") {
                target.style.position = "relative";
            }
            
            const rect = target.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const ripple = document.createElement("span");
            ripple.className = "ripple-circle";
            ripple.style.left = `${x}px`;
            ripple.style.top = `${y}px`;
            
            const maxDim = Math.max(rect.width, rect.height);
            ripple.style.width = `${maxDim / 2}px`;
            ripple.style.height = `${maxDim / 2}px`;
            
            target.appendChild(ripple);
            setTimeout(() => ripple.remove(), 600);
            
            AudioEngine.init();
            
            if (target.classList.contains("nav-link")) {
                AudioEngine.play("navClick");
                
                // Navbar click sparkle bursts
                for (let i = 0; i < 6; i++) {
                    setTimeout(() => {
                        const randomX = rect.left + window.pageXOffset + Math.random() * rect.width;
                        const randomY = rect.top + window.pageYOffset + Math.random() * rect.height;
                        createCardSparkle(randomX, randomY);
                    }, i * 60);
                }
            } else {
                AudioEngine.play("valueSetting");
            }
        } else {
            // Wake context on other page clicks
            AudioEngine.init();
        }
    });

    // ----------------------------------------------------------------------
    // 3D Floating Gold Coins Background Generator
    // ----------------------------------------------------------------------
    function init3DCoins() {
        const canvas = document.getElementById("bitcoin-canvas");
        if (!canvas) return;
        const ctx = canvas.getContext("2d");

        let coins = [];

        function resizeCanvas() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
        window.addEventListener("resize", resizeCanvas);
        resizeCanvas();

        const themes = [
            {
                name: "skyblue",
                frontStart: "rgba(255, 255, 255, 0.95)",
                frontMid: "rgba(14, 165, 233, 0.85)",
                frontEnd: "rgba(56, 189, 248, 0.95)",
                backStart: "rgba(56, 189, 248, 0.9)",
                backEnd: "rgba(255, 255, 255, 0.85)",
                rimStart: "rgba(14, 165, 233, 0.9)",
                rimEnd: "rgba(56, 189, 248, 0.85)",
                border: "rgba(14, 165, 233, 1.0)",
                textShadow: "rgba(14, 165, 233, 1.0)"
            },
            {
                name: "purple",
                frontStart: "rgba(255, 255, 255, 0.95)",
                frontMid: "rgba(168, 85, 247, 0.85)",
                frontEnd: "rgba(139, 92, 246, 0.95)",
                backStart: "rgba(139, 92, 246, 0.9)",
                backEnd: "rgba(255, 255, 255, 0.85)",
                rimStart: "rgba(168, 85, 247, 0.9)",
                rimEnd: "rgba(139, 92, 246, 0.85)",
                border: "rgba(168, 85, 247, 1.0)",
                textShadow: "rgba(168, 85, 247, 1.0)"
            },
            {
                name: "emerald",
                frontStart: "rgba(255, 255, 255, 0.95)",
                frontMid: "rgba(16, 185, 129, 0.85)",
                frontEnd: "rgba(52, 211, 153, 0.95)",
                backStart: "rgba(52, 211, 153, 0.9)",
                backEnd: "rgba(255, 255, 255, 0.85)",
                rimStart: "rgba(16, 185, 129, 0.9)",
                rimEnd: "rgba(52, 211, 153, 0.85)",
                border: "rgba(16, 185, 129, 1.0)",
                textShadow: "rgba(16, 185, 129, 1.0)"
            },
            {
                name: "amber",
                frontStart: "rgba(255, 255, 255, 0.95)",
                frontMid: "rgba(245, 158, 11, 0.85)",
                frontEnd: "rgba(251, 191, 36, 0.95)",
                backStart: "rgba(251, 191, 36, 0.9)",
                backEnd: "rgba(255, 255, 255, 0.85)",
                rimStart: "rgba(245, 158, 11, 0.9)",
                rimEnd: "rgba(251, 191, 36, 0.85)",
                border: "rgba(245, 158, 11, 1.0)",
                textShadow: "rgba(245, 158, 11, 1.0)"
            }
        ];

        // 3D Coin point calculation and drawing
        function draw3DCoin(cx, cy, radius, thickness, rotX, rotY, rotZ, theme) {
            const numPoints = 24; // Optimization
            const pointsFront = [];
            const pointsBack = [];
            
            for (let i = 0; i < numPoints; i++) {
                const angle = (i / numPoints) * Math.PI * 2;
                const cos = Math.cos(angle);
                const sin = Math.sin(angle);
                pointsFront.push({ x: cos * radius, y: sin * radius, z: thickness / 2 });
                pointsBack.push({ x: cos * radius, y: sin * radius, z: -thickness / 2 });
            }
            
            const rotateAndProject = (p) => {
                let y1 = p.y * Math.cos(rotX) - p.z * Math.sin(rotX);
                let z1 = p.y * Math.sin(rotX) + p.z * Math.cos(rotX);
                let x2 = p.x * Math.cos(rotY) + z1 * Math.sin(rotY);
                let z2 = -p.x * Math.sin(rotY) + z1 * Math.cos(rotY);
                let x3 = x2 * Math.cos(rotZ) - y1 * Math.sin(rotZ);
                let y3 = x2 * Math.sin(rotZ) + y1 * Math.cos(rotZ);
                return { x: cx + x3, y: cy + y3, z: z2 };
            };
            
            const projFront = pointsFront.map(rotateAndProject);
            const projBack = pointsBack.map(rotateAndProject);
            
            const u = { x: radius, y: 0, z: thickness / 2 };
            const v = { x: 0, y: radius, z: thickness / 2 };
            const projU = rotateAndProject(u);
            const projV = rotateAndProject(v);
            const projCenter = rotateAndProject({ x: 0, y: 0, z: thickness / 2 });
            
            const ux = projU.x - projCenter.x;
            const uy = projU.y - projCenter.y;
            const vx = projV.x - projCenter.x;
            const vy = projV.y - projCenter.y;
            const crossZ = ux * vy - uy * vx;
            
            const drawFace = (projPoints, isFront) => {
                ctx.beginPath();
                ctx.moveTo(projPoints[0].x, projPoints[0].y);
                for (let i = 1; i < numPoints; i++) {
                    ctx.lineTo(projPoints[i].x, projPoints[i].y);
                }
                ctx.closePath();
                
                const grad = ctx.createLinearGradient(cx - radius, cy - radius, cx + radius, cy + radius);
                if (isFront) {
                    grad.addColorStop(0, theme.frontStart);
                    grad.addColorStop(0.5, theme.frontMid);
                    grad.addColorStop(1, theme.frontEnd);
                } else {
                    grad.addColorStop(0, theme.backStart);
                    grad.addColorStop(1, theme.backEnd);
                }
                
                ctx.fillStyle = grad;
                ctx.fill();
                ctx.strokeStyle = theme.border;
                ctx.lineWidth = 1;
                ctx.stroke();
                
                ctx.save();
                const a = ux / radius;
                const b = uy / radius;
                const c = vx / radius;
                const d = vy / radius;
                ctx.transform(a, b, c, d, projCenter.x, projCenter.y);
                
                ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
                ctx.font = `bold ${radius * 0.85}px 'Space Grotesk', sans-serif`;
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.shadowColor = theme.textShadow;
                ctx.shadowBlur = 4;
                ctx.fillText("₿", 0, 0);
                ctx.restore();
            };
            
            const drawRim = () => {
                for (let i = 0; i < numPoints; i++) {
                    const next = (i + 1) % numPoints;
                    const normalZ = (projFront[i].x - projBack[i].x) * (projFront[next].y - projFront[i].y) - 
                                    (projFront[i].y - projBack[i].y) * (projFront[next].x - projFront[i].x);
                    if (normalZ <= 0) {
                        ctx.beginPath();
                        ctx.moveTo(projFront[i].x, projFront[i].y);
                        ctx.lineTo(projFront[next].x, projFront[next].y);
                        ctx.lineTo(projBack[next].x, projBack[next].y);
                        ctx.lineTo(projBack[i].x, projBack[i].y);
                        ctx.closePath();
                        
                        const gradSide = ctx.createLinearGradient(projFront[i].x, projFront[i].y, projBack[next].x, projBack[next].y);
                        gradSide.addColorStop(0, theme.rimStart);
                        gradSide.addColorStop(1, theme.rimEnd);
                        
                        ctx.fillStyle = gradSide;
                        ctx.fill();
                        ctx.strokeStyle = theme.border;
                        ctx.lineWidth = 0.5;
                        ctx.stroke();
                    }
                }
            };
            
            if (crossZ > 0) {
                drawFace(projBack, false);
                drawRim();
                drawFace(projFront, true);
            } else {
                drawFace(projFront, true);
                drawRim();
                drawFace(projBack, false);
            }
        }

        // Initialize coins
        const numCoins = 14;
        for (let i = 0; i < numCoins; i++) {
            coins.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height - canvas.height,
                z: Math.random() * 200 - 100, // Depth
                size: Math.random() * 30 + 40, // Increased size: radius 40 to 70
                speedY: Math.random() * 1.3 + 0.6,
                speedX: (Math.random() - 0.5) * 0.35,
                rotX: Math.random() * Math.PI,
                rotY: Math.random() * Math.PI,
                rotZ: Math.random() * Math.PI,
                rotSpeedX: (Math.random() - 0.5) * 0.02,
                rotSpeedY: (Math.random() - 0.5) * 0.03,
                rotSpeedZ: (Math.random() - 0.5) * 0.015,
                theme: themes[Math.floor(Math.random() * themes.length)]
            });
        }

        function animate() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Sort by depth
            coins.sort((a, b) => a.z - b.z);
            
            coins.forEach(coin => {
                coin.y += coin.speedY;
                coin.x += coin.speedX;
                coin.rotX += coin.rotSpeedX;
                coin.rotY += coin.rotSpeedY;
                coin.rotZ += coin.rotSpeedZ;
                
                // Boundaries reset
                if (coin.y - coin.size * 2 > canvas.height) {
                    coin.y = -coin.size * 2;
                    coin.x = Math.random() * canvas.width;
                    coin.z = Math.random() * 200 - 100;
                    coin.size = Math.random() * 30 + 40; // Randomize size on reset
                    coin.speedY = Math.random() * 1.3 + 0.6;
                    coin.speedX = (Math.random() - 0.5) * 0.35;
                    coin.theme = themes[Math.floor(Math.random() * themes.length)]; // Randomize theme on reset
                }
                if (coin.x + coin.size * 2 < 0) {
                    coin.x = canvas.width + coin.size * 2;
                } else if (coin.x - coin.size * 2 > canvas.width) {
                    coin.x = -coin.size * 2;
                }
                
                const scale = 1 + coin.z * 0.002;
                const drawRadius = coin.size * scale;
                const thickness = drawRadius * 0.22;
                
                // Set high opacity (opaque)
                const alpha = 0.5 + (coin.z + 100) * 0.0025; // Depth range: 0.5 to 1.0
                ctx.globalAlpha = Math.max(0.45, Math.min(0.95, alpha));
                
                draw3DCoin(coin.x, coin.y, drawRadius, thickness, coin.rotX, coin.rotY, coin.rotZ, coin.theme);
            });
            
            ctx.globalAlpha = 1.0;
            requestAnimationFrame(animate);
        }
        animate();
    }

    // ----------------------------------------------------------------------
    // URL Hash-based Routing & Persistent Views
    // ----------------------------------------------------------------------
    function handleInitialHash() {
        const hash = window.location.hash;
        if (hash) {
            const targetId = hash.replace("#", "");
            const matchingLink = document.querySelector(`.nav-link[data-target="${targetId}"]`);
            if (matchingLink) {
                matchingLink.click();
            }
        }
    }

    window.addEventListener("hashchange", () => {
        const hash = window.location.hash;
        if (hash) {
            const targetId = hash.replace("#", "");
            const matchingLink = document.querySelector(`.nav-link[data-target="${targetId}"]`);
            if (matchingLink && !matchingLink.classList.contains("active")) {
                matchingLink.click();
            }
        } else {
            const defaultLink = document.querySelector('.nav-link[data-target="dashboard"]');
            if (defaultLink && !defaultLink.classList.contains("active")) {
                defaultLink.click();
            }
        }
    });

    // Run dynamic initializations
    init3DTilt();
    init3DCoins();

    // Hook up sounds for other value settings (inputs, selects, textareas)
    const valueInputs = document.querySelectorAll("input, select, textarea");
    valueInputs.forEach(input => {
        if (input.type !== "range" && !input.id.startsWith("slider-")) {
            input.addEventListener("input", () => {
                AudioEngine.play("valueSetting");
            });
            input.addEventListener("focus", () => {
                AudioEngine.play("inputFocus");
            });
        }
    });

    handleInitialHash();
});
