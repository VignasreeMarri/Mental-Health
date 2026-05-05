# Research Notes & Assets

## India SVG Path Data
I'll use a more comprehensive set of paths for the India Map.

### Proposed SVG Structure
```html
<svg class="india-map-svg" viewBox="0 0 800 900" xmlns="http://www.w3.org/2000/svg">
    <!-- North -->
    <path class="state-path" data-state="Jammu & Kashmir" d="M300,50 L350,30 L400,60 L380,120 L320,130 Z" />
    <path class="state-path" data-state="Himachal Pradesh" d="M350,130 L400,120 L420,150 L380,180 Z" />
    <path class="state-path" data-state="Punjab" d="M280,150 L330,140 L350,190 L300,200 Z" />
    <path class="state-path" data-state="Haryana" d="M330,200 L380,190 L390,230 L340,240 Z" />
    <path class="state-path" data-state="Uttarakhand" d="M400,150 L450,160 L440,210 L390,200 Z" />
    <path class="state-path" data-state="Delhi" d="M350,225 L370,225 L370,245 L350,245 Z" />
    <path class="state-path" data-state="Uttar Pradesh" d="M380,240 L550,250 L520,380 L360,350 Z" />
    <path class="state-path" data-state="Rajasthan" d="M120,200 L300,220 L320,380 L150,420 Z" />
    
    <!-- Central -->
    <path class="state-path" data-state="Madhya Pradesh" d="M250,380 L480,380 L520,530 L300,550 Z" />
    <path class="state-path" data-state="Gujarat" d="M50,380 L220,380 L250,520 L100,530 Z" />
    
    <!-- East -->
    <path class="state-path" data-state="Bihar" d="M550,260 L680,270 L650,350 L560,350 Z" />
    <path class="state-path" data-state="Jharkhand" d="M560,360 L680,360 L700,450 L580,450 Z" />
    <path class="state-path" data-state="West Bengal" d="M680,280 L720,280 L750,500 L680,480 Z" />
    <path class="state-path" data-state="Odisha" d="M550,460 L680,460 L620,600 L520,550 Z" />
    <path class="state-path" data-state="Chhattisgarh" d="M480,420 L550,430 L550,600 L480,550 Z" />
    
    <!-- South -->
    <path class="state-path" data-state="Maharashtra" d="M150,540 L450,540 L400,680 L200,680 Z" />
    <path class="state-path" data-state="Telangana" d="M380,600 L500,600 L500,700 L380,720 Z" />
    <path class="state-path" data-state="Andhra Pradesh" d="M400,700 L550,600 L580,800 L450,850 Z" />
    <path class="state-path" data-state="Karnataka" d="M220,690 L380,690 L400,850 L250,850 Z" />
    <path class="state-path" data-state="Tamil Nadu" d="M380,820 L480,820 L450,950 L380,950 Z" />
    <path class="state-path" data-state="Kerala" d="M320,860 L380,860 L360,950 L320,950 Z" />
    
    <!-- Northeast (Simplified Cluster) -->
    <path class="state-path" data-state="Northeast Cluster" d="M720,250 L850,250 L850,400 L720,400 Z" />
</svg>
```

## Enhancement List for AI Chatbot
- **Recommended Prompts**:
  - "I'm feeling anxious about my exams."
  - "How can I improve my sleep?"
  - "I need someone to talk to."
  - "Tell me a relaxation technique."

## Indian Doctor Updates
- Use clearer Indian names and specialties.
- Add "Consultation Fee" and "Wait Time" for realism.
- Update images to better quality portraits.

## Dashboard Integration
- **Mood Heatmap**: A small grid showing mood frequency over the last 30 days.
- **Goal Progress**: Simple progress bars for "Journals Written" or "Meditation Minutes".
