require 'net/http'
require 'uri'
require 'json'
require 'openssl'

module Api
  class ContactsController < ApplicationController
    def create
      contact_data = contact_params

      # Validate required fields
      unless valid_contact?(contact_data)
        render json: { error: 'Missing required fields' }, status: :unprocessable_entity
        return
      end

      # Format payload for Microsoft Teams webhook
      teams_payload = {
        "@type": "MessageCard",
        "@context": "http://schema.org/extensions",
        "themeColor": "00d4aa",
        "summary": "New Lead from VouchPro Website",
        "sections": [{
          "activityTitle": "📋 New Contact Form Submission",
          "activitySubtitle": Time.current.strftime("%B %d, %Y at %I:%M %p"),
          "facts": [
            { "name": "Name", "value": contact_data[:name] },
            { "name": "Email", "value": contact_data[:email] },
            { "name": "Mobile", "value": contact_data[:mobile] },
            { "name": "Interest", "value": contact_data[:interest] },
            { "name": "Message", "value": contact_data[:message].presence || "No message provided" },
            { "name": "Consent", "value": contact_data[:consent] == 'true' ? "✅ Agreed" : "❌ Not agreed" }
          ],
          "markdown": true
        }]
      }

      # Send to Teams webhook
      webhook_url = ENV['TEAMS_WEBHOOK_URL']

      if webhook_url.blank?
        Rails.logger.error "TEAMS_WEBHOOK_URL environment variable is not set"
        render json: { error: 'Webhook not configured' }, status: :internal_server_error
        return
      end

      begin
        response = send_to_webhook(webhook_url, teams_payload)
        
        if response.is_a?(Net::HTTPSuccess)
          Rails.logger.info "Contact form submitted successfully: #{contact_data[:email]}"
          render json: { message: 'Thank you for your interest! We will contact you shortly.' }, status: :ok
        else
          Rails.logger.error "Webhook responded with: #{response.code} - #{response.body}"
          render json: { error: 'Failed to submit form' }, status: :bad_gateway
        end
      rescue StandardError => e
        Rails.logger.error "Error sending to webhook: #{e.message}"
        render json: { error: 'An error occurred while processing your request' }, status: :internal_server_error
      end
    end

    private

    def contact_params
      params.permit(:name, :email, :mobile, :interest, :message, :consent)
    end

    def valid_contact?(data)
      data[:name].present? &&
        data[:email].present? &&
        data[:mobile].present? &&
        data[:interest].present? &&
        data[:consent].present?
    end

    def send_to_webhook(url, payload)
      uri = URI.parse(url)
      http = Net::HTTP.new(uri.host, uri.port)
      http.use_ssl = true
      http.verify_mode = OpenSSL::SSL::VERIFY_PEER
      http.open_timeout = 10
      http.read_timeout = 10
      
      # Use system CA certificates
      http.ca_file = ENV['SSL_CERT_FILE'] if ENV['SSL_CERT_FILE']
      
      # Fallback: try common CA paths on macOS
      ca_paths = [
        '/etc/ssl/cert.pem',
        '/usr/local/etc/openssl/cert.pem',
        '/usr/local/etc/openssl@1.1/cert.pem',
        '/opt/homebrew/etc/openssl@3/cert.pem'
      ]
      
      ca_paths.each do |path|
        if File.exist?(path)
          http.ca_file = path
          break
        end
      end

      request = Net::HTTP::Post.new(uri.request_uri)
      request['Content-Type'] = 'application/json'
      request.body = payload.to_json

      http.request(request)
    end
  end
end

