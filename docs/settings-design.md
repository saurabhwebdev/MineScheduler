# Settings Page - Modern Tabbed Interface

## Design Overview

The Settings page has been completely redesigned with a modern, clean tabbed card interface similar to modern SaaS applications like Stripe, Vercel, and GitHub.

## Key Features

### 1. **Horizontal Tab Navigation**
- Clean tabs at the top of the page
- Active tab indicator (blue underline)
- Icon + text labels for better UX
- Easy to extend with new settings sections

### 2. **Card-Based Layout**
- Full-width card container
- Clear section headers with title and description
- Generous padding and spacing
- Professional shadow effects

### 3. **Modern Styling**
- **Primary Color**: #062d54 (App Blue)
- **Hover Color**: #0a3d6e (Darker Blue)
- **Border Radius**: 8px for buttons/inputs, 12px for modals
- **Smooth Transitions**: 0.2-0.3s ease animations
- **Subtle Shadows**: For depth and hierarchy

### 4. **Enhanced Components**

#### Buttons
- Rounded corners (8px)
- Subtle shadow on default state
- Lift effect on hover (translateY)
- Clear visual feedback

#### Tables
- Clean headers with uppercase text
- Hover effects on rows
- Proper spacing and borders
- Modern pagination

#### Modals
- Rounded corners (12px)
- Header and footer with subtle background
- Enhanced button styling
- Better form input appearance

#### Form Inputs
- Consistent 40px height
- 8px border radius
- Blue focus ring effect
- Smooth transitions

### 5. **Responsive Design**
- Mobile-friendly breakpoints
- Adjusted padding on smaller screens
- Proper tab sizing

## Current Sections

### UOM Configuration
- Manage Units of Measurement
- Full CRUD operations (Add, Edit, Delete)
- Search and sort functionality
- Admin-only access control

## Future Extensibility

The design is built to easily add more settings sections:

```javascript
{
  key: 'general',
  label: <span><SettingOutlined />General Settings</span>,
  children: <GeneralSettings />
}
```

## Color Palette

| Usage | Hex Code | Description |
|-------|----------|-------------|
| Primary | #062d54 | Main app blue |
| Primary Hover | #0a3d6e | Darker blue for hover states |
| Background | #fafafa | Light gray backgrounds |
| Border | #f0f0f0 | Very light gray borders |
| Text Primary | #062d54 | Main text color |
| Text Secondary | #595959 | Secondary text |
| Text Muted | #8c8c8c | Muted/disabled text |
| Success | #3cca70 | Success states |
| Error | #ff4d4f | Error/danger states |

## Best Practices

1. **Consistency**: All settings sections should follow the same card layout pattern
2. **Spacing**: Use 32px padding for card body, 24px for sections
3. **Typography**: Maintain hierarchy with proper heading sizes
4. **Feedback**: Always provide visual feedback on interactions
5. **Accessibility**: Maintain proper color contrast and focus states
