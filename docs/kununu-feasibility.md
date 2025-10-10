# Kununu Ratings Integration Feasibility Report

## Executive Summary

This report evaluates safe, ToS-compliant methods to display Kununu ratings on StepStone pages within our MV3 browser extension. The analysis focuses on legally acceptable data sources, performance optimization through caching, and privacy compliance.

## 1. Sources Landscape

| Source | ToS Compliance | CORS Implications | Pros | Cons | Risk Level | Feasibility for MVP |
|--------|----------------|-------------------|------|------|------------|-------------------|
| **Kununu Company Widget** | ✅ Compliant | None (designed for embedding) | Official integration, maintained by Kununu, easy implementation | Requires Kununu account, limited customization | Low | **Yes** |
| **Kununu Public API** | ❓ Uncertain | Unknown | Potentially comprehensive data | No public documentation found, likely requires partnership | Medium | No |
| **Structured Data (JSON-LD)** | ❓ Unclear | Potential CORS issues | Direct data access | Inconsistent availability, ToS compliance uncertain | Medium | No |
| **StepStone-Kununu Partnership** | ✅ Compliant | None | Official integration | No evidence of existing partnership | Low | No |
| **Third-Party Scraping Services** | ❌ Likely non-compliant | Managed by service | No development effort | ToS violation risk, legal concerns, IP blocking risk | High | No |
| **Prebuilt Offline Mapping** | ✅ Compliant | None | Fast access, no runtime requests | Requires regular updates, limited coverage | Low | **Yes** (fallback) |

## 2. Compliance & Risk Analysis

### Actions to Avoid
- ❌ Scraping Kununu's website without explicit permission
- ❌ Storing or transmitting Personally Identifiable Information (PII)
- ❌ Exceeding reasonable request rates that could be interpreted as abuse
- ❌ Reverse engineering Kununu's internal APIs
- ❌ Bypassing rate limiting or anti-bot measures

### Data We Will NOT Store
- User-specific data or PII
- Sensitive company information not publicly available
- Raw HTML content from Kununu pages
- User browsing behavior or analytics

### User Transparency Requirements
- Include clear disclosure in About/Privacy section
- State that Kununu ratings are sourced via official widgets
- Explain data caching and update frequency
- Provide opt-out mechanism for users

### Rate Limiting Strategy
- **Primary (Kununu Widget)**: Respect Kununu's widget usage policies
- **Fallback (Offline Mapping)**: No runtime requests = no rate limiting needed
- **General Guideline**: Maximum 1 request per company per 24 hours if using any API

### Cache TTL Policy
- **Widget Data**: 24 hours (balances freshness with performance)
- **Offline Mapping**: Monthly updates (manual process)
- **Rationale**: Ratings don't change frequently, reduces server load

## 3. Data Contract Preview

```typescript
type CompanyRating = {
  rating: number | null;           // Average rating (1-5 scale)
  reviewsCount?: number | null;     // Number of reviews
  url?: string;                     // Link to Kununu company page
  updatedAt: string;               // ISO timestamp of last update
};

// Resolves nulls gracefully if data not found
function getCompanyRating(companyName: string): Promise<CompanyRating>;
```

### Input Specifications
- **Normalized company name**: Cleaned, standardized company identifier
- **Examples**: "SAP SE", "BMW Group", "Deutsche Bank AG"

### Output Specifications
- **rating**: `null` if no rating available, otherwise number 1-5
- **reviewsCount**: `null` if count unavailable, otherwise positive integer
- **url**: `null` if no Kununu page exists, otherwise valid URL
- **updatedAt**: Always present, ISO 8601 timestamp

### Error/Fallback Semantics
- ✅ Return `null` values for missing data
- ✅ Never throw exceptions
- ✅ Handle network errors gracefully
- ✅ Provide meaningful fallback UI states

## 4. Recommendation

### Primary Approach: Kununu Company Widget
**Rationale**: 
- ToS compliant (designed for embedding)
- Official integration maintained by Kununu
- Minimal development effort
- Reliable data source

**Implementation**:
- Embed Kununu's official company widget
- Customize styling to match StepStone's design
- Handle widget loading states gracefully

### Fallback Approach: Prebuilt Offline Mapping
**Rationale**:
- Zero runtime network requests
- Complete ToS compliance
- Fast performance
- Reliable for MVP testing

**Implementation**:
- Curated dataset of top German companies
- Monthly manual updates
- JSON file with company name → rating mapping

### Next Small Coding Step
**Add provider interface and stub function**:
```javascript
// Create src/data/kununuProvider.js
// Implement getCompanyRating() with widget integration
// Add caching layer with chrome.storage.local
// Handle company name normalization
```

## 5. Operational Plan

### Provider Location in Repository
```
src/
  data/
    kununuProvider.js     # Main provider implementation
    companyMapping.json   # Offline fallback data
  utils/
    companyNormalizer.js  # Company name standardization
```

### Communication Architecture
- **Content Script → Provider**: Direct function call
- **Provider → Storage**: chrome.storage.local for persistence
- **Provider → Widget**: DOM injection for Kununu widget
- **No Background Script**: Keep architecture simple for MVP

### Caching Implementation

#### Chrome Storage Schema
```javascript
// Storage key pattern: kununu_rating_{normalizedCompanyName}
{
  "kununu_rating_sap_se": {
    "rating": 4.2,
    "reviewsCount": 1250,
    "url": "https://www.kununu.com/de/sap",
    "updatedAt": "2024-01-15T10:30:00Z",
    "cachedAt": "2024-01-15T10:30:00Z"
  }
}
```

#### In-Memory Per-Tab Cache
- Store ratings in content script memory
- Key: `companyName` → `CompanyRating`
- Lifecycle: Tab session duration
- Purpose: Reduce storage API calls

### Performance Considerations
- **Widget Loading**: Async loading with loading states
- **Cache Hit Rate**: Target >80% for offline mapping
- **Storage Quota**: Estimate <1MB for 1000 companies
- **Memory Usage**: <100KB per tab for in-memory cache

## 6. Implementation Timeline

### Phase 1: Foundation (Next Step)
1. Create `src/data/kununuProvider.js`
2. Implement `getCompanyRating()` stub
3. Add company name normalization
4. Set up basic caching structure

### Phase 2: Widget Integration
1. Integrate Kununu company widget
2. Handle loading states and errors
3. Implement storage persistence
4. Add in-memory caching

### Phase 3: Fallback System
1. Create offline company mapping
2. Implement fallback logic
3. Add manual update mechanism
4. Test with limited dataset

## 7. Risk Mitigation

### Legal Risks
- ✅ Use only official Kununu widgets
- ✅ Avoid any scraping or reverse engineering
- ✅ Respect rate limits and usage policies
- ✅ Provide clear user disclosure

### Technical Risks
- ✅ Implement graceful degradation
- ✅ Handle widget loading failures
- ✅ Cache data to reduce dependency
- ✅ Provide offline fallback

### Privacy Risks
- ✅ Store only public rating data
- ✅ No user tracking or analytics
- ✅ Clear data retention policies
- ✅ User control over data collection

## Conclusion

The **Kununu Company Widget** approach provides the optimal balance of compliance, reliability, and implementation simplicity. With a **prebuilt offline mapping** as fallback, we can deliver a robust MVP that respects both platforms' ToS while providing valuable functionality to users.

**Next Action**: Implement the provider interface and stub function in `src/data/kununuProvider.js` to begin widget integration.

---

*This feasibility study was conducted without implementing any network code or modifying the manifest.json file, as requested.*

