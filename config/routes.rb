Rails.application.routes.draw do
  namespace :api do
    resources :contacts, only: [:create]
  end

  # Health check endpoint for monitoring
  get "up" => "rails/health#show", as: :rails_health_check

  # Serve index.html for root path
  root to: redirect('/index.html')
end
