# Format
All patches must follow this format:  
  
```javascript
/*
 * Description:
 * <desc>
 * 
 * Applies to:
 * <versions, separated by newline>
 * 
 * Patched by:
 * <who>
 */

if (RepoUtil.isSupported(["<version matching>"])) {
    // Code
}
```  
  
# Example
See koipatch.js
