# **Leetrack**

## **Core Value Proposition**

A social gamification layer that transforms solitary LeetCode practice into collaborative group learning through browser extension tracking and web-based social features.

## **Technical Architecture**

### **Browser Extension**

- Monitors leetcode.com for problem submissions in real-time  
- Detects "Accepted" status on submission pages  
- Performs one-time historical import using LeetCode session cookies (client-side only)  
- Sends problem IDs and timestamps to companion platform API  
- No code execution or problem storage—pure tracking layer

### **Web Platform**

- Central hub for all social features, analytics, and gamification  
- Stores NeetCode 250 problem list locally (metadata only: ID, title, difficulty, tags)  
- Links to neetcode.io for problem solutions and explanations  
- User authentication and group management

## **Group System**

### **Multi-Group Architecture**

- Users can join unlimited groups simultaneously  
- Each group operates independently with own leaderboards and challenges  
- Invite-only via shareable link or join code  
- Supports different contexts: college friends, work colleagues, online communities

### **Group Roles & Settings**

- Group creator has admin privileges  
- Admin configures challenge size (e.g., 5, 7, 10, or 15 problems) as group setting  
- All members can propose challenges and vote

## **Weekly Challenge System**

### **Challenge Creation Flow**

1. **Proposal Phase** (Friday-Sunday): Any member proposes a themed challenge from NeetCode 250 categories  
2. **Voting Phase** (Friday-Sunday): Members upvote proposals  
3. **Selection** (Sunday night): Top-voted proposal becomes official weekly challenge  
4. **Active Challenge** (Monday-Sunday): Members solve problems and compete on challenge leaderboard

### **Challenge Structure**

- Theme-based (Arrays, DP, Graphs, etc.) from NeetCode 250 categories  
- Problem count determined by group admin setting  
- Difficulty mix within selected theme  
- Fallback: If no proposals, auto-select default template

### **Tie Handling**

- Include both tied problems (flexible within admin-set range)  
- Or: Group admin breaks tie

## **Problem Self-Assessment**

### **Post-Solve Rating**

After each accepted submission, users rate their experience:

- **Struggled**: Needed to reference solutions  
- **Solved with Hints**: Required some help  
- **Solved Independently**: Figured it out alone  
- **Mastered**: Solved quickly and confidently

### **Data Usage**

- Personal analytics: Identify weak topics for review  
- Group insights: Aggregate difficulty data shows collective weak areas

## **Gamification System**

### **XP & Leveling**

- Easy problems: 10 XP  
- Medium problems: 25 XP  
- Hard problems: 50 XP  
- Bonus multipliers: First solve in group (2x)  
- Display progress bars toward next level

### **Badges**

Individual achievements:

- Milestone badges: "First Problem," "10 Club," "50 Club," "100 Club"  
- Challenge badges: "First Blood" (first to complete weekly challenge)

Group achievements:

- "Century Sprint" (100 problems solved collectively in one week)  
- "Perfect Week" (all members active)

### **Leaderboards**

**Challenge Leaderboard** (weekly reset):

- Ranks members by challenge completion (e.g., "7/10 problems solved")  
- Active only during challenge week  
- Resets every Monday

**Group Leaderboard** (all-time):

- Total NeetCode 250 problems solved  
- Total XP earned  
- Displays all members regardless of challenge participation

## **Activity & Engagement**

### **Real-Time Feed**

- Live updates when members solve problems: "Sarah solved Two Sum \- 2 min ago"  
- Challenge progress notifications: "Mike completed the weekly challenge\!"  
- Group milestones: "Your group reached 500 total problems\!"

## **User Onboarding**

### **New User Flow**

1. Install browser extension  
2. Create account on web platform  
3. One-time historical import from LeetCode  
4. Join or create first group  
5. Participate in weekly challenge voting

### **Historical Data Import**

- Extension reads LeetCode session cookie client-side  
- Queries LeetCode GraphQL API for submission history  
- Filters for NeetCode 250 problems  
- Sends sanitized data (problem IDs \+ timestamps) to platform  
- User receives full credit for past solves

## **Data Strategy**

### **Problem Data Storage**

- Store NeetCode 250 metadata locally (not copyrighted content)  
- Fields: `leetcode_id`, `slug`, `title`, `difficulty`, `tags`, `premium_flag`  
- Weekly sync job updates from LeetCode GraphQL API  
- Link all problems to neetcode.io for solutions

### **User Data Tracked**

- Submission timestamps and problem IDs  
- Self-assessed difficulty ratings  
- Group memberships  
- Challenge participation and progress  
- XP totals and badge unlocks

## **Privacy & Legal**

### **Session Cookie Handling**

- Never stored in backend database  
- Extension uses cookie client-side only for one-time import  
- User consent required for data access

### **LeetCode ToS Compliance**

- Store only metadata, not problem statements or test cases  
- Link to neetcode.io for premium problem access  
- Read-only API usage

## **Success Metrics**

### **Growth**

- Extension installs and daily active users  
- Group creation rate  
- Invitation acceptance rate (viral coefficient)

### **Engagement**

- Weekly active users returning  
- Problems solved per user per week  
- Challenge participation rate  
- Group retention (% of groups active after 4 weeks)

### **Quality**

- Self-assessment completion rate  
- Average problems per challenge completion

## **Competitive Differentiation**

**vs LeetCode native**: Adds social layer, group challenges, gamification LeetCode lacks

**vs LeetBuddies/LeetFriends**: Group-based (not just friend-following), structured weekly challenges, self-assessment tracking

**vs NeetCode**: Complements rather than competes—drives traffic to neetcode.io while adding social practice layer

## **MVP Scope**

**Must-Have Features**:

- Extension with real-time tracking \+ historical import  
- Multiple group support with invite links/codes  
- Weekly challenge voting system  
- Group admin settings (challenge size configuration)  
- Problem self-assessment after each solve  
- Challenge and group leaderboards  
- Basic XP and badge system  
- Activity feed  
- NeetCode 250 problem list with neetcode.io links
