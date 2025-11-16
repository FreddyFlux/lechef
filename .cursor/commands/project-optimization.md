We have made a lot of progress on the app.
While making the progress, building feature and functionality was our focus.
Now its time to revise the whole project and look for opportunities to optimize and clean it up.

I want help to:

- Look for opporunities to outsource duplicate code or closely related code to a common reusabke component.
- Look for un-used code to be cleaned up.
- Look for "use client" beeing used "higher up" in the component tree than it needs to. "use client" should be outsourced to the absolute lowest point where we need user interactivity.
- Look for linting errors / type errors to clean up.
- Look for "any" types and type it properly.
- Look for potential security breaches where data is handled incorrectly or passed unsafe.
- Look for potential data breaches where user data is accessible for unauthenticated users (keep in mind that we have "share" functionality on some user generated data, like workout plans and workouts).
- Look for potential to optimize project size.
- Look for potential to optimize caching plans.
- Look for potential to optimize for deploying to production.
