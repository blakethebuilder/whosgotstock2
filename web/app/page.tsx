// ... around line 631 in web/app/page.tsx
            {showCategoryBrowser && (
              <div 
                className="fixed inset-0 z-[500] flex items-center justify-center p-4 overflow-y-auto bg-black/50 backdrop-blur-sm"
                onClick={(e) => {
                  if (e.target === e.currentTarget) {
                    setShowCategoryBrowser(false);
                  }
                }}
              >
                <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden">
                  <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <h3 className="text-xl font-black text-gray-900 dark:text-gray-100">Browse Categories</h3>
                    <button
                      onClick={() => setShowCategoryBrowser(false)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className="p-6 overflow-y-auto max-h-[calc(85vh-120px)]">
                    <CategoryBrowser
                      selectedCategories={selectedCategories}
                      onCategoriesChange={setSelectedCategories}
                      onCategoryClick={(category) => {
                        if (!selectedCategories.includes(category)) {
                          setSelectedCategories([...selectedCategories, category]);
                        }
                        performSearch();
                      }}
                    />
                  </div>
                </div>
              </div>
            )}