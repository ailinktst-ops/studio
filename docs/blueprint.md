# **App Name**: RankUp Counter

## Core Features:

- Title Definition: Allow users to define a custom title for the ranking display.
- Participant Addition: Enable users to add participant names, initializing their counts to zero.
- Counter Increment: Provide a button to increment the count for each participant.
- Ranking Calculation: Automatically reorganize participants based on their counts in descending order.
- Top 3 Display: Display only the top 3 participants on the ranking screen.
- Real-time Updates: Utilize Firestore with real-time listeners to update the ranking screen whenever a count is incremented, a name is added, or the reset button is triggered.
- Data Reset: Provide a button to reset all counts to zero while retaining names and the title in Firestore.

## Style Guidelines:

- Primary color: Deep purple (#673AB7) to convey sophistication and engagement.
- Background color: Light gray (#EEEEEE) for a clean, unobtrusive backdrop.
- Accent color: Teal (#009688) for highlighting interactive elements.
- Body and headline font: 'Inter', a grotesque-style sans-serif font known for its modern and neutral appearance. 'Inter' works well for both headlines and body text.
- Use clean, minimalist icons to represent actions like incrementing or resetting counts.
- Employ a clear, straightforward layout with a prominent display of the top 3 ranked participants.
- Use subtle animations for ranking updates and transitions.