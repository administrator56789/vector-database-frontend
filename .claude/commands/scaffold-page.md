Create a new NexVec page component.

The component name is: $ARGUMENTS

Follow these conventions exactly (match existing pages like IngestPage, DocumentsPage, QueryPage):

1. **File**: `src/components/{Name}Page.jsx`
2. **No TypeScript** — plain JavaScript only
3. **Styling**: Use existing CSS classes from `src/index.css` (`card`, `btn-primary`, `section-title`, etc.) and Tailwind utilities. No inline styles for static values.
4. **State**: Local `useState`/`useEffect` only — no global state
5. **API calls**: Import from `src/api/nexvec.js`. If a new endpoint is needed, add it there first.
6. **Loading/error pattern**: Mirror DocumentsPage — `loading` boolean state + `error` string state with a red alert div
7. **Props**: Accept `{ onRefresh }` callback prop if the page mutates documents
8. **Structure**:
   ```jsx
   export default function {Name}Page({ onRefresh }) {
     // state
     // handlers
     return (
       <div className="fade-in" style={{ padding: '2rem' }}>
         <div className="section-title">...</div>
         {/* content */}
       </div>
     );
   }
   ```

After creating the component file:
- Add the tab to `App.jsx`: increment the tab count, add a sidebar entry, and render the new page in the tab switch block
- Do NOT add a router — the project uses integer `activeTab` switching

Generate the complete component now.
