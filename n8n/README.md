# n8n Workflows for FitFuel

This directory contains n8n workflow configurations for the FitFuel application. These workflows handle various automation tasks such as reminders and notifications.

## Prerequisites

1. n8n installed and running (can be self-hosted or cloud)
2. Supabase API credentials
3. Email or notification service credentials (e.g., SendGrid, Twilio, etc.)

## Workflows

### 1. Daily Reminder Workflow

**Purpose**: Sends reminders to users who haven't logged any meals or workouts by a certain time of day.

**Trigger**: Scheduled (e.g., daily at 7 PM)

**Steps**:

1. **HTTP Request**: Query Supabase for users who haven't logged any meals or workouts today
   - Method: GET
   - URL: `{{$node["Webhook"].json["baseUrl"]}}/api/analytics/daily-check`
   - Headers: 
     - `Authorization: Bearer {{$node["Webhook"].json["supabaseServiceKey"]}}`
     - `Content-Type: application/json`

2. **Code**: Process the response to filter users who need reminders
   ```javascript
   const users = items[0].json.users || [];
   return users.map(user => ({
     json: {
       userId: user.id,
       email: user.email,
       name: user.name || 'there',
       hasLoggedMeals: user.has_logged_meals,
       hasLoggedWorkouts: user.has_logged_workouts
     }
   }));
   ```

3. **Send Email/SMS**: Send personalized reminders
   - For email (using SendGrid):
     - From: `noreply@fitfuel.app`
     - To: `{{$node["Code"].json["email"]}}`
     - Subject: `📅 Don't forget to log your meals and workouts!`
     - Body: 
       ```
       Hi {{$node["Code"].json["name"]}},
       
       Just a friendly reminder to log your meals and workouts for today!
       
       {{^$node["Code"].json["hasLoggedMeals"]}}🍽️ You haven't logged any meals today.{{/$node["Code"].json["hasLoggedMeals"]}}
       {{^$node["Code"].json["hasLoggedWorkouts"]}}💪 You haven't logged any workouts today.{{/$node["Code"].json["hasLoggedWorkouts"]}}
       
       Log now: {{$node["Webhook"].json["appUrl"]}}/dashboard
       
       Thanks,
       The FitFuel Team
       ```

### 2. Weekly Progress Report

**Purpose**: Sends a weekly summary of the user's fitness progress.

**Trigger**: Scheduled (e.g., every Monday at 9 AM)

**Steps**:

1. **HTTP Request**: Get all active users
   - Method: GET
   - URL: `{{$node["Webhook"].json["baseUrl"]}}/api/users/active`

2. **HTTP Request (for each user)**: Get weekly stats
   - Method: GET
   - URL: `{{$node["Webhook"].json["baseUrl"]}}/api/analytics/summary?userId={{$node["HTTP Request1"].json["id"]}}&period=week`

3. **Send Email**: Send weekly report with stats
   - Customize based on user preferences (email/SMS)
   - Include progress charts (generated as images)
   - Provide encouragement and suggestions

### 3. Goal Achievement Notifications

**Purpose**: Sends congratulatory messages when users achieve their fitness goals.

**Trigger**: Webhook from Supabase (triggered on goal completion)

**Steps**:

1. **Webhook**: Receive goal completion event from Supabase

2. **Send Notification**:
   - Custom message based on goal type
   - Include achievement badge if applicable
   - Suggest next steps or new goals

## Setup Instructions

1. **Environment Variables**:
   - `SUPABASE_URL`: Your Supabase project URL
   - `SUPABASE_SERVICE_KEY`: Your Supabase service role key
   - `SENDGRID_API_KEY`: For sending emails
   - `TWILIO_ACCOUNT_SID` and `TWILIO_AUTH_TOKEN`: For SMS notifications
   - `APP_URL`: Your application's public URL

2. **Import Workflows**:
   - In n8n, go to "Workflows"
   - Click "Import from File"
   - Select the desired workflow JSON file
   - Update credentials and variables as needed

3. **Activate Workflows**:
   - Toggle the "Active" switch to enable the workflow
   - Set up appropriate schedules or webhook endpoints

## Security Considerations

- Store sensitive credentials in n8n's credentials store, not in the workflow JSON
- Use the principle of least privilege for API keys
- Implement rate limiting on API endpoints
- Log all automation activities for auditing

## Monitoring and Maintenance

- Set up error notifications for failed workflows
- Monitor execution history for any issues
- Regularly review and update workflows as your application evolves
- Test workflows after any significant changes to your API

## Troubleshooting

1. **Workflow not triggering**:
   - Check the schedule configuration
   - Verify that the workflow is active
   - Check n8n logs for errors

2. **API errors**:
   - Verify API endpoints are correct
   - Check authentication tokens
   - Ensure required permissions are set

3. **Notification delivery issues**:
   - Check email/SMS service status
   - Verify recipient addresses/numbers
   - Check spam/junk folders

## Best Practices

1. **Error Handling**:
   - Implement proper error handling in all API calls
   - Set up retries for transient failures
   - Log detailed error messages

2. **Performance**:
   - Use pagination for large datasets
   - Implement caching where appropriate
   - Consider timeouts for long-running operations

3. **User Experience**:
   - Allow users to opt-out of notifications
   - Respect user preferences for notification frequency and channel
   - Provide clear instructions for managing notifications

## Example API Endpoints

### Get Users Needing Reminders

```
GET /api/analytics/daily-check
```

**Response**:
```json
{
  "users": [
    {
      "id": "user-uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "has_logged_meals": false,
      "has_logged_workouts": false,
      "notification_preferences": {
        "email": true,
        "sms": false
      }
    }
  ]
}
```

### Get Weekly Summary

```
GET /api/analytics/summary?userId=:userId&period=week
```

**Response**:
```json
{
  "period": "2023-04-10 to 2023-04-16",
  "user": {
    "id": "user-uuid",
    "name": "John Doe"
  },
  "nutrition": {
    "total_calories": 14500,
    "average_daily_calories": 2071,
    "macros": {
      "protein_g": 350,
      "carbs_g": 1200,
      "fat_g": 400
    }
  },
  "workouts": {
    "total_workouts": 5,
    "total_duration_minutes": 240,
    "calories_burned": 2500
  },
  "goals": [
    {
      "type": "protein_intake",
      "target": 2000,
      "current": 1850,
      "progress": 92.5,
      "achieved": false
    }
  ]
}
```

## License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.
