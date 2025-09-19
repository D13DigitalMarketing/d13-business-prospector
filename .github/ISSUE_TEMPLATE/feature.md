---
name: Feature Request
about: Suggest a new feature for the business prospector
title: '[FEAT] '
labels: ['feat', 'priority-medium']
assignees: ''
---

## Feature Description
<!-- Clear, concise description of the feature -->

## User Story
<!-- As a [user type], I want to [goal] so that [benefit] -->

## Acceptance Criteria
<!-- List specific requirements that must be met -->

- [ ] **Requirement 1**: Description
- [ ] **Requirement 2**: Description
- [ ] **Requirement 3**: Description

## Technical Requirements

### Test Cases Required
<!-- List specific test cases that must be implemented FIRST -->

- [ ] **Happy Path Test**: Description
- [ ] **Error Handling Test**: Description
- [ ] **Edge Case Test**: Description
- [ ] **Integration Test**: Description

### TypeScript Requirements
- [ ] All code must be TypeScript (no .js files)
- [ ] Strict type checking must pass
- [ ] All functions must have explicit return types
- [ ] No `any` types without justification

### Performance Requirements
- [ ] Must respect API rate limits
- [ ] Should handle large result sets efficiently
- [ ] Error handling for network failures

## Implementation Notes
<!-- Technical details, API endpoints, data structures, etc. -->

```typescript
// Example interfaces or types if relevant
interface FeatureData {
  // Define expected data structure
}
```

## Dependencies
<!-- List any dependencies on other issues or external services -->

- Depends on: #[issue-number]
- Requires: [external dependency]

## Definition of Done
- [ ] Feature implemented with TypeScript
- [ ] Unit tests written and passing (TDD approach)
- [ ] Integration tests passing
- [ ] Code coverage maintains 80% minimum
- [ ] CLAUDE.md updated if needed
- [ ] Manual testing completed
- [ ] Code review completed (if applicable)

## Priority
<!-- Select one -->
- [ ] High (blocks other work)
- [ ] Medium (normal development)
- [ ] Low (nice to have)

## Estimated Complexity
<!-- Select one -->
- [ ] Small (1-2 days)
- [ ] Medium (3-5 days)
- [ ] Large (1+ weeks)

---
**Remember**: Follow TDD - write tests FIRST, then implement feature!