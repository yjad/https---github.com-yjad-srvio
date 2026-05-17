### Scope:
- Scope-1 is Home services (cleaning, plumbing, hvac, Dry cleaning, shoe repair, etc.)
- Scope-2 is Drop off (Delivery, Delivery & Store, Store, Pickup, ...``)

### Pricing:
- [X] fixed prices (per job)
- [] Per hour (Provider give an estimated time range)
- [] We need to add (per item/unit, per distance, per area). 
- [] Some services prices are starting price "From X",  How can we handle payment for it?
- [] What is the payment flow for service which are per hour

### Payment:
- [] What is the flow for per hour payments? Who estimates the time? (Provider or Customer?)
- [] What is the flow for payments when there is a dispute

### Service completion:
- [X] if service requests before and after images of the service, provider will not be able to complete the service without uploading the images.

### Disputes:
- [ ] What is the flow for disputes?    

### Scheduling:
- [ ] Right now, we don't have a feature for scheduling services (only order and pay for it now). 
- [ ] We need to add a feature for scheduled services (every 1 weed/month/..)   .

### login
- [X] we need verify email before create account.

### Customer Service (CS)
- [ ] add a new role called Customer Service (CS)
- [X] we need to add a feature for cs role to see all pending services and approve or reject them. 
- [ ] in CS Dashboard add a tab for disputes, and show all disputes in this tab.
- [ ] add a tab for pending services for CS role.
- [] in CS Support, have a feature to see all service approval history

### Admin
- [X] in Admin/Users need to add button for add user for each type (admin, customer service role)
- [] add a search bar in each table to search for a specific user.

### Services Page:
- [X] we need to allow showing images from the providers account for each service.
- [X] services page structure organized now under families and then categories. 
- [ ] We need to add a feature to show services with price 0 and show message "Contact us for more details" instead of price.   

### Service Provider Porfile:
- [X] We need to add a feature for service providers to upload images of their services to show one image for the service in the service page 
- [X] What is the flow for provider verification?

### Create Account Page:
- [X] Verify email using by sending email to customer/provider with a PIN number. for this task, simulate sending email.
- [X] shall we validate phone number when create account for customer and service provider?

# Defects
1- [ ] on creating a customer (get started, ..) the customer user is created with flag isVerified as false. this is not the case of customer, it is only valid for Provider type.

2- [] 