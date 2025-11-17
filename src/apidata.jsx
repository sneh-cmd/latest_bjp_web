// API Configuration for Corporation Central Web Service
// Base URL for the web service (using proxy in development)
export const BASE_URL = import.meta.env.DEV ? '/api' : 'http://ntmc.mhbjplok.com';

// Import localStorage manager for dynamic URL handling
import localStorageManager from './utils/localStorage.js';

// Web Service endpoint
export const WEB_SERVICE_URL = `${BASE_URL}/webservice.asmx`;

// Helper function to get dynamic API URL from localStorage
const getDynamicApiUrl = () => {
  const apiUrl = localStorageManager.getApiUrl();
  if (!apiUrl) {
    throw new Error('No API URL found in session. Please select a corporation panel first.');
  }
  
  // In development, use proxy to avoid CORS issues
  if (import.meta.env.DEV) {
    return '/panel-api/webservice.asmx';
  }
  return `${apiUrl}/webservice.asmx`;
};

// Helper function to safely get admin endpoint - checks panelApiUrl first, then falls back to localStorage
const getAdminEndpoint = (panelApiUrl) => {
  // If panelApiUrl is provided, use it directly
  if (panelApiUrl) {
    // Check if panelApiUrl already includes /webservice.asmx
    if (panelApiUrl.includes('/webservice.asmx')) {
      return import.meta.env.DEV ? '/panel-api/webservice.asmx' : panelApiUrl;
    } else {
      return import.meta.env.DEV ? '/panel-api/webservice.asmx' : `${panelApiUrl}/webservice.asmx`;
    }
  } else {
    // Otherwise, try to get dynamic API URL from localStorage
    try {
      return getDynamicApiUrl();
    } catch (error) {
      // Fallback if no API URL found in localStorage
      console.warn('No API URL in localStorage, using fallback:', error.message);
      return import.meta.env.DEV ? '/panel-api/webservice.asmx' : 'http://ntmc2.mhbjplok.com/webservice.asmx';
    }
  }
};

// Authentication Configuration
export const AUTH_CONFIG = {
  // API credentials provided by the API provider
  USERNAME: '990GUJ934ELE5328CENTER',
  PASSWORD: '123',
  TOKEN: 'GUJ_ELE_CENER'
};

// Admin Login Authentication Configuration
export const ADMIN_AUTH_CONFIG = {
  // Admin login credentials
  USERNAME: 'Election@2022',
  PASSWORD: '2022#2022',
  TOKEN: 'Elect@2022#'
};

// API Endpoints - SOAP Web Service
export const API_ENDPOINTS = {
  // Display all copy per
  DISPLAY_ALL_COPY_PER: WEB_SERVICE_URL,
  
  // Display all corporation
  DISPLAY_ALL_CORPORATION: import.meta.env.DEV ? '/corporation-api/webservice.asmx' : 'http://corporationcentral2.mhbjplok.com/webservice.asmx',
  
  // Display corporation wise panel
  DISPLAY_CORPORATION_WISE_PANEL: import.meta.env.DEV ? '/corporation-panel-api/webservice.asmx' : 'http://corporationcentral2.mhbjplok.com/webservice.asmx',
  
  // Select copy
  SELECT_COPY: WEB_SERVICE_URL,
  
  // Select copy per
  SELECT_COPY_PER: WEB_SERVICE_URL
};

// API Service Functions
export const apiService = {
  // Function to make SOAP API calls
  async makeRequest(endpoint, method = 'POST', soapAction = '', soapBody = '', useAdminAuth = false) {
    try {
      const authConfig = useAdminAuth ? ADMIN_AUTH_CONFIG : AUTH_CONFIG;
      
      console.log('Making SOAP API request to:', endpoint);
      console.log('Using credentials:', {
        USERNAME: authConfig.USERNAME || '(empty)',
        PASSWORD: authConfig.PASSWORD ? '***' : '(empty)',
        TOKEN: authConfig.TOKEN || '(empty)',
        AUTH_TYPE: useAdminAuth ? 'ADMIN' : 'CORPORATION'
      });
      
      // Debug authentication config
      console.log('Raw authConfig:', authConfig);
      console.log('useAdminAuth flag:', useAdminAuth);
      console.log('ADMIN_AUTH_CONFIG:', ADMIN_AUTH_CONFIG);
      console.log('AUTH_CONFIG:', AUTH_CONFIG);
      
      // Create SOAP envelope with AuthUser header
      const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Header>
    <AuthUser xmlns="http://tempuri.org/">
      <UserName>${authConfig.USERNAME}</UserName>
      <Password>${authConfig.PASSWORD}</Password>
      <Token>${authConfig.TOKEN}</Token>
    </AuthUser>
  </soap:Header>
  <soap:Body>
    ${soapBody || '<display_all_corporation xmlns="http://tempuri.org/" />'}
  </soap:Body>
</soap:Envelope>`;


      const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': `"http://tempuri.org/${soapAction}"`,
          'Accept': 'text/xml',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        body: soapEnvelope
      };

      const response = await fetch(endpoint, options);
      
      console.log('API response status:', response.status);
      console.log('API response headers:', Object.fromEntries(response.headers.entries()));
      console.log('Request endpoint:', endpoint);
      console.log('Request SOAPAction:', soapAction);
      console.log('Request body (first 500 chars):', soapEnvelope.substring(0, 500));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log('Error response text:', errorText);
        console.log('Request endpoint:', endpoint);
        console.log('Request SOAPAction:', soapAction);
        console.log('Request body:', soapEnvelope);
        
        // Try to extract error message from SOAP fault if present
        let errorMessage = `HTTP error! status: ${response.status} - ${response.statusText}`
        if (errorText) {
          const faultMatch = errorText.match(/<faultstring>(.*?)<\/faultstring>/s);
          if (faultMatch) {
            errorMessage = `Server error: ${faultMatch[1].trim()}`
          } else if (errorText.length < 500) {
            errorMessage = `Server error: ${errorText}`
          }
        }
        
        throw new Error(errorMessage);
      }
      
      const responseText = await response.text();
      console.log('API response text (first 500 chars):', responseText.substring(0, 500));
      
      // Parse SOAP response
      return this.parseSoapResponse(responseText, soapAction);
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  },

  // Function to parse SOAP XML response
  parseSoapResponse(xmlText, soapAction = '') {
    try {
      
      // Check for authentication errors first
      if (xmlText.includes('Invalid User') || xmlText.includes('Authentication failed')) {
        throw new Error('Authentication failed: Invalid credentials');
      }
      
      // Check for SOAP fault
      if (xmlText.includes('soap:Fault') || xmlText.includes('faultstring')) {
        const faultMatch = xmlText.match(/<faultstring>(.*?)<\/faultstring>/s);
        const faultMessage = faultMatch ? faultMatch[1].trim() : 'Unknown SOAP fault';
        throw new Error(`SOAP fault: ${faultMessage}`);
      }
      
      // Extract JSON from SOAP response based on the action
      let resultTag = 'display_all_corporationResult';
      if (soapAction === 'display_corporation_wise_panel') {
        resultTag = 'display_corporation_wise_panelResult';
      } else if (soapAction === 'admin_login') {
        resultTag = 'admin_loginResult';
      } else if (soapAction === 'display_admin') {
        resultTag = 'display_adminResult';
      } else if (soapAction === 'dis_sub_admin') {
        resultTag = 'dis_sub_adminResult';
      } else if (soapAction === 'display_volunteer') {
        resultTag = 'display_volunteerResult';
      } else if (soapAction === 'display_sakti_kendra_parmukh') {
        resultTag = 'display_sakti_kendra_parmukhResult';
      } else if (soapAction === 'display_call_center') {
        resultTag = 'display_call_centerResult';
      } else if (soapAction === 'display_booth_pramukh') {
        resultTag = 'display_booth_pramukhResult';
      } else if (soapAction === 'dis_all_booth_with_all_total') {
        resultTag = 'dis_all_booth_with_all_totalResult';
      } else if (soapAction === 'display_booth_wise_voter') {
        resultTag = 'display_booth_wise_voterResult';
      } else if (soapAction === 'display_sakti_pramukh_cadre') {
        resultTag = 'display_sakti_pramukh_cadreResult';
      } else if (soapAction === 'display_booth_pramukh_by_sakti_pramukh') {
        resultTag = 'display_booth_pramukh_by_sakti_pramukhResult';
      } else if (soapAction === 'display_booth_pramukh_cadre') {
        resultTag = 'display_booth_pramukh_cadreResult';

      } else if (soapAction === 'dis_building_pramukh') {
        resultTag = 'dis_building_pramukhResult';

      } else if (soapAction === 'dis_building_pramukh_cadre_with_voter') {
        resultTag = 'dis_building_pramukh_cadre_with_voterResult';
      } else if (soapAction === 'dis_all_address') {
        resultTag = 'dis_all_addressResult';
      } else if (soapAction === 'dis_all_polling_location') {
        resultTag = 'dis_all_polling_locationResult';
      } else if (soapAction === 'display_polling_location_wise_voter') {
        resultTag = 'display_polling_location_wise_voterResult';
      } else if (soapAction === 'address_wise_search') {
        resultTag = 'address_wise_searchResult';
      } else if (soapAction === 'dis_all_surname') {
        resultTag = 'dis_all_surnameResult';
      } else if (soapAction === 'surname_wise_search') {
        resultTag = 'surname_wise_searchResult';
      } else if (soapAction === 'age_wise_search') {
        resultTag = 'age_wise_searchResult';
      } else if (soapAction === 'display_all_booth_for_sakti_allocation') {
        resultTag = 'display_all_booth_for_sakti_allocationResult';
      } else if (soapAction === 'insert_admin') {
        resultTag = 'insert_adminResult';
      } else if (soapAction === 'update_admin') {
        resultTag = 'update_adminResult';
      } else if (soapAction === 'dis_booth_pramukh_wise_voter') {
        resultTag = 'dis_booth_pramukh_wise_voterResult';
      } else if (soapAction === 'dis_admin_survey_dashboard') {
        resultTag = 'dis_admin_survey_dashboardResult';
      } else if (soapAction === 'dis_type_wise_user_list_from_survey') {
        resultTag = 'dis_type_wise_user_list_from_surveyResult';
      } else if (soapAction === 'no_survey_user_by_type') {
        resultTag = 'no_survey_user_by_typeResult';
      } else if (soapAction === 'dis_education_wise_survey_dash') {
        resultTag = 'dis_education_wise_survey_dashResult';
      } else if (soapAction === 'dis_education_wise_survey_voter') {
        resultTag = 'dis_education_wise_survey_voterResult';
      } else if (soapAction === 'dis_cast_wise_survey_dash') {
        resultTag = 'dis_cast_wise_survey_dashResult';
      } else if (soapAction === 'dis_cast_wise_survey_voter') {
        resultTag = 'dis_cast_wise_survey_voterResult';
      } else if (soapAction === 'dis_community_wise_survey_dash') {
        resultTag = 'dis_community_wise_survey_dashResult';
      } else if (soapAction === 'dis_commuinity_wise_survey_voter') {
        resultTag = 'dis_commuinity_wise_survey_voterResult';
      } else if (soapAction === 'dis_ration_card_wise_survey_dash') {
        resultTag = 'dis_ration_card_wise_survey_dashResult';
      } else if (soapAction === 'dis_ration_card_wise_survey_voter') {
        resultTag = 'dis_ration_card_wise_survey_voterResult';
      } else if (soapAction === 'dis_scheme_wise_survey_dash') {
        resultTag = 'dis_scheme_wise_survey_dashResult';
      } else if (soapAction === 'dis_scheme_wise_survey_voter') {
        resultTag = 'dis_scheme_wise_survey_voterResult';
      } else if (soapAction === 'dis_booth_wise_survey_dash') {
        resultTag = 'dis_booth_wise_survey_dashResult';
      } else if (soapAction === 'dis_booth_wise_survey_voter') {
        resultTag = 'dis_booth_wise_survey_voterResult';
      } else if (soapAction === 'dis_date_wise_survey_dash') {
        resultTag = 'dis_date_wise_survey_dashResult';
      } else if (soapAction === 'dis_date_wise_survey_voter') {
        resultTag = 'dis_date_wise_survey_voterResult';
      } else if (soapAction === 'dis_user_wise_survey_voter') {
        resultTag = 'dis_user_wise_survey_voterResult';
      } else if (soapAction === 'display_voter_survey_log') {
        resultTag = 'display_voter_survey_logResult';
      } else if (soapAction === 'sel_survey_detail') {
        resultTag = 'sel_survey_detailResult';
      } else if (soapAction === 'dis_designation') {
        resultTag = 'dis_designationResult';
      } else if (soapAction === 'dis_redevelopment_building') {
        resultTag = 'dis_redevelopment_buildingResult';
      } else if (soapAction === 'dis_death_voter') {
        resultTag = 'dis_death_voterResult';
      } else if (soapAction === 'dis_shifted_out_voter') {
        resultTag = 'dis_shifted_out_voterResult';
      } else if (soapAction === 'display_all_phonebook_match_admin') {
        resultTag = 'display_all_phonebook_match_adminResult';
      } else if (soapAction === 'display_phonebook_member') {
        resultTag = 'display_phonebook_memberResult';
      }
      
      const jsonMatch = xmlText.match(new RegExp(`<${resultTag}>(.*?)<\/${resultTag}>`, 's'));
      if (jsonMatch) {
        const jsonString = jsonMatch[1].trim();
        
        // Check if the result is just plain text (like "Invalid User")
        if (!jsonString.startsWith('{') && !jsonString.startsWith('[')) {
          throw new Error(`API returned: ${jsonString}`);
        }
        
        const parsedData = JSON.parse(jsonString);
        
        // Transform the data based on the action
        // Handle different success codes - "1" for data, "2" for operation success
        if ((parsedData.Success === "1" || parsedData.Success === "2") && parsedData.result) {
          // Special handling for insert_admin endpoint
          if (soapAction === 'insert_admin') {
            // Treat Success="2" as success; Column1==ok is the common response but not mandatory
            if (parsedData.Success === "2") {
              if (parsedData.result && parsedData.result[0] && parsedData.result[0].Column1 === "ok") {
                return { success: true, message: "Building pramukh created successfully" };
              }
              return { success: true, message: 'Insert operation completed' };
            }
            return parsedData.result;
          }
          
          // Special handling for update_admin endpoint
          if (soapAction === 'update_admin') {
            // Treat Success="2" as success
            if (parsedData.Success === "2") {
              if (parsedData.result && parsedData.result[0] && parsedData.result[0].Column1 === "ok") {
                return { success: true, message: "Admin updated successfully" };
              }
              return { success: true, message: 'Update operation completed' };
            }
            return parsedData.result;
          }
          
        // Special handling for address list endpoint
        if (soapAction === 'dis_all_address') {
          return parsedData.result;
        }
        
        // Special handling for address wise search endpoint
        if (soapAction === 'address_wise_search') {
          return parsedData.result;
        }
        
        // Special handling for polling location endpoint
        if (soapAction === 'dis_all_polling_location') {
          return parsedData.result;
        }
        
        // Special handling for polling location wise voter endpoint
        if (soapAction === 'display_polling_location_wise_voter') {
          return parsedData.result;
        }
        
        // Special handling for surname endpoint
        if (soapAction === 'dis_all_surname') {
          return parsedData.result;
        }
        
        // Special handling for surname wise search endpoint
        if (soapAction === 'surname_wise_search') {
          return parsedData.result;
        }
        
        // Special handling for age wise search endpoint
        if (soapAction === 'age_wise_search') {
          return parsedData.result;
        }
        
        // Special handling for designation endpoint
        if (soapAction === 'dis_designation') {
          return parsedData.result;
        }
        
        // Special handling for redevelopment building endpoint
        if (soapAction === 'dis_redevelopment_building') {
          return parsedData.result;
        }
        
        // Special handling for death survey endpoint
        if (soapAction === 'dis_death_voter') {
          return parsedData.result;
        }
        
        // Special handling for shifted out voter endpoint
        if (soapAction === 'dis_shifted_out_voter') {
          return parsedData.result;
        }
        
        // Special handling for phonebook match admin endpoint
        if (soapAction === 'display_all_phonebook_match_admin') {
          return parsedData.result;
        }
        
        // Special handling for phonebook member endpoint
        if (soapAction === 'display_phonebook_member') {
          return parsedData.result;
        }
        
        // Special handling for type wise user list from survey endpoint
        if (soapAction === 'dis_type_wise_user_list_from_survey') {
          // Transform the result array and map P, N, D, C to proper field names
          if (Array.isArray(parsedData.result)) {
            return parsedData.result.map(item => ({
              id: item.admin_id,
              admin_id: item.admin_id,
              name: item.name || '',
              phone: item.mobile_no || '',
              mobile_no: item.mobile_no || '',
              type: item.type || '',
              sub_type: item.sub_type || '',
              designation: item.designation || '',
              booth_javabdari: item.booth_javabdari || '',
              page_javabdari: item.page_javabdari || '',
              photo_path: item.photo_path || '',
              // Map survey counts
              positive: item.P || 0,
              negative: item.N || 0,
              doubtful: item.D || 0,
              cant_say: item.C || 0,
              nothing: item.C || 0, // For backward compatibility
              totalSurvey: item.total || 0,
              total: item.total || 0
            }));
          }
          return parsedData.result || [];
        }
        
        // Special handling for no survey user by type endpoint
        if (soapAction === 'no_survey_user_by_type') {
          // Transform the result array
          if (Array.isArray(parsedData.result)) {
            return parsedData.result.map(item => ({
              id: item.admin_id || item.id,
              admin_id: item.admin_id || item.id,
              name: item.name || '',
              phone: item.mobile_no || item.phone || '',
              mobile_no: item.mobile_no || item.phone || '',
              type: item.type || '',
              sub_type: item.sub_type || '',
              designation: item.designation || '',
              booth_javabdari: item.booth_javabdari || '',
              page_javabdari: item.page_javabdari || '',
              photo_path: item.photo_path || ''
            }));
          }
          return parsedData.result || [];
        }
        
        // Special handling for education wise survey dashboard endpoint
        if (soapAction === 'dis_education_wise_survey_dash') {
          // Transform the result array
          if (Array.isArray(parsedData.result)) {
            return parsedData.result.map((item, index) => {
              // Parse values from API response - API uses: name, P, N, D, C, total
              const positive = Number(item.P || 0)
              const negative = Number(item.N || 0)
              const doubtful = Number(item.D || 0)
              const cantSay = Number(item.C || 0)
              const totalFromAPI = Number(item.total || 0)
              
              // Calculate sum of all survey responses
              const calculatedTotal = positive + negative + doubtful + cantSay
              
              // Use total from API, or calculate from responses if total is missing
              const totalSurvey = totalFromAPI || calculatedTotal
              
              // For totalVoters, use the same value as totalSurvey since API doesn't provide separate voter count
              const totalVoters = totalSurvey
              
              return {
                id: item.id || item.category_id || item.education_id || item.profession_id || item.name_id || (index + 1),
                category: item.name || item.education || item.category || '',
                totalVoters: totalVoters,
                totalSurvey: totalSurvey,
                positive: positive,
                negative: negative,
                doubtful: doubtful,
                nothing: cantSay
              }
            });
          }
          return parsedData.result || [];
        }
        
        // Special handling for caste wise survey dashboard endpoint
        if (soapAction === 'dis_cast_wise_survey_dash') {
          // Transform the result array - similar to education wise survey
          if (Array.isArray(parsedData.result)) {
            return parsedData.result.map((item, index) => {
              // Parse values from API response - API uses: name, P, N, D, C, total
              const positive = Number(item.P || 0)
              const negative = Number(item.N || 0)
              const doubtful = Number(item.D || 0)
              const cantSay = Number(item.C || 0)
              const totalFromAPI = Number(item.total || 0)
              
              // Calculate sum of all survey responses
              const calculatedTotal = positive + negative + doubtful + cantSay
              
              // Use total from API, or calculate from responses if total is missing
              const totalSurvey = totalFromAPI || calculatedTotal
              
              // For totalVoters, use the same value as totalSurvey since API doesn't provide separate voter count
              const totalVoters = totalSurvey
              
              return {
                id: item.id || item.caste_id || item.category_id || (index + 1),
                casteName: item.name || item.caste_name || item.caste || '',
                totalVoters: totalVoters,
                totalSurvey: totalSurvey,
                positive: positive,
                negative: negative,
                doubtful: doubtful,
                nothing: cantSay
              }
            });
          }
          return parsedData.result || [];
        }
        
        // Special handling for community wise survey dashboard endpoint
        if (soapAction === 'dis_community_wise_survey_dash') {
          // Transform the result array - similar to caste wise survey
          if (Array.isArray(parsedData.result)) {
            return parsedData.result.map((item, index) => {
              // Parse values from API response - API uses: name, P, N, D, C, total
              const positive = Number(item.P || 0)
              const negative = Number(item.N || 0)
              const doubtful = Number(item.D || 0)
              const cantSay = Number(item.C || 0)
              const totalFromAPI = Number(item.total || 0)
              
              // Calculate sum of all survey responses
              const calculatedTotal = positive + negative + doubtful + cantSay
              
              // Use total from API, or calculate from responses if total is missing
              const totalSurvey = totalFromAPI || calculatedTotal
              
              // For totalVoters, use the same value as totalSurvey since API doesn't provide separate voter count
              const totalVoters = totalSurvey
              
              return {
                id: item.id || item.community_id || item.category_id || (index + 1),
                communityName: item.name || item.community_name || item.community || '',
                totalVoters: totalVoters,
                totalSurvey: totalSurvey,
                positive: positive,
                negative: negative,
                doubtful: doubtful,
                nothing: cantSay
              }
            });
          }
          return parsedData.result || [];
        }
        
        // Special handling for ration card wise survey dashboard endpoint
        if (soapAction === 'dis_ration_card_wise_survey_dash') {
          // Transform the result array - similar to community/caste wise survey
          if (Array.isArray(parsedData.result)) {
            return parsedData.result.map((item, index) => {
              // Parse values from API response - API uses: name, P, N, D, C, total
              const positive = Number(item.P || 0)
              const negative = Number(item.N || 0)
              const doubtful = Number(item.D || 0)
              const cantSay = Number(item.C || 0)
              const totalFromAPI = Number(item.total || 0)
              
              // Calculate sum of all survey responses
              const calculatedTotal = positive + negative + doubtful + cantSay
              
              // Use total from API, or calculate from responses if total is missing
              const totalSurvey = totalFromAPI || calculatedTotal
              
              // For totalVoters, use the same value as totalSurvey since API doesn't provide separate voter count
              const totalVoters = totalSurvey
              
              return {
                id: item.id || item.ration_card_id || item.category_id || (index + 1),
                cardType: item.name || item.card_type || item.cardType || item.ration_card_type || '',
                totalVoters: totalVoters,
                totalSurvey: totalSurvey,
                positive: positive,
                negative: negative,
                doubtful: doubtful,
                nothing: cantSay
              }
            });
          }
          return parsedData.result || [];
        }
        
        // Special handling for scheme wise survey dashboard endpoint
        if (soapAction === 'dis_scheme_wise_survey_dash') {
          // Transform the result array - similar to ration card/community/caste wise survey
          if (Array.isArray(parsedData.result)) {
            return parsedData.result.map((item, index) => {
              // Parse values from API response - API uses: name, P, N, D, C, total
              const positive = Number(item.P || 0)
              const negative = Number(item.N || 0)
              const doubtful = Number(item.D || 0)
              const cantSay = Number(item.C || 0)
              const totalFromAPI = Number(item.total || 0)
              
              // Calculate sum of all survey responses
              const calculatedTotal = positive + negative + doubtful + cantSay
              
              // Use total from API, or calculate from responses if total is missing
              const totalSurvey = totalFromAPI || calculatedTotal
              
              // For totalVoters, use the same value as totalSurvey since API doesn't provide separate voter count
              const totalVoters = totalSurvey
              
              return {
                id: item.id || item.scheme_id || item.category_id || (index + 1),
                schemeName: item.name || item.scheme_name || item.scheme || '',
                totalVoters: totalVoters,
                totalSurvey: totalSurvey,
                positive: positive,
                negative: negative,
                doubtful: doubtful,
                nothing: cantSay
              }
            });
          }
          return parsedData.result || [];
        }
        
        // Special handling for booth wise survey dashboard endpoint
        if (soapAction === 'dis_booth_wise_survey_dash') {
          console.log('Processing dis_booth_wise_survey_dash response...')
          console.log('parsedData:', parsedData)
          console.log('parsedData.result:', parsedData.result)
          
          // Transform the result array - similar to scheme/ration card/community/caste wise survey
          if (Array.isArray(parsedData.result)) {
            console.log('Processing array of', parsedData.result.length, 'items')
            const mappedData = parsedData.result.map((item, index) => {
              console.log(`Processing item ${index}:`, item)
              
              // Parse values from API response - API might use: booth_no, P, N, D, C, total, voters
              const positive = Number(item.P || item.positive || 0)
              const negative = Number(item.N || item.negative || 0)
              const doubtful = Number(item.D || item.doubtful || 0)
              const cantSay = Number(item.C || item.cant_say || item.nothing || 0)
              const totalFromAPI = Number(item.total || item.survey || item.total_survey || 0)
              
              // Try multiple field names for voters - booth API might have separate voter count
              console.log(`Item ${index} raw voters fields:`, {
                voters: item.voters,
                total_voters: item.total_voters,
                totalVoters: item.totalVoters,
                voter_count: item.voter_count,
                voters_count: item.voters_count,
                total_voter: item.total_voter,
                totalVoter: item.totalVoter,
                voter: item.voter,
                mtdata: item.mtdata,
                matdata: item.matdata,
                total_mtdata: item.total_mtdata,
                total_matdata: item.total_matdata
              })
              
              const votersFromAPI = Number(
                item.voters || 
                item.total_voters || 
                item.totalVoters || 
                item.voter_count || 
                item.voters_count ||
                item.total_voter ||
                item.totalVoter ||
                item.voter ||
                item.mtdata ||
                item.matdata ||
                item.total_mtdata ||
                item.total_matdata ||
                0
              )
              
              console.log(`Item ${index} votersFromAPI:`, votersFromAPI)
              
              // Calculate sum of all survey responses
              const calculatedTotal = positive + negative + doubtful + cantSay
              
              // Use total from API, or calculate from responses if total is missing
              const totalSurvey = totalFromAPI || calculatedTotal
              
              // Use voters from API - don't fallback to survey total, voters should be separate
              // If votersFromAPI is 0 or undefined, try to get it from other fields
              const totalVoters = votersFromAPI > 0 ? votersFromAPI : (Number(item.total_voter || item.totalVoter || item.voter || 0) || 0)
              
              console.log(`Item ${index} final totalVoters:`, totalVoters)
              
              // Try multiple field names for booth number
              const boothNo = item.booth_no || item.boothNo || item.booth_number || item.booth || item.name || item.id || (index + 1)
              
              const mappedItem = {
                id: item.id || item.booth_id || item.booth_no || item.boothNo || (index + 1),
                boothNo: boothNo,
                voters: totalVoters,
                survey: totalSurvey,
                positive: positive,
                negative: negative,
                doubtful: doubtful,
                nothing: cantSay
              }
              
              console.log(`Mapped item ${index}:`, mappedItem)
              return mappedItem
            });
            
            console.log('Mapped booth data:', mappedData)
            return mappedData
          }
          
          console.warn('parsedData.result is not an array:', parsedData.result)
          return parsedData.result || [];
        }
        
        // Special handling for date wise survey dashboard endpoint
        if (soapAction === 'dis_date_wise_survey_dash') {
          console.log('Processing dis_date_wise_survey_dash response...')
          console.log('parsedData:', parsedData)
          console.log('parsedData.result:', parsedData.result)
          
          // Transform the result array - API returns date and survey count
          if (Array.isArray(parsedData.result)) {
            console.log('Processing array of', parsedData.result.length, 'items')
            return parsedData.result.map((item, index) => {
              console.log(`Processing item ${index}:`, item)
              
              // Parse survey count from API response - try multiple possible field names
              const surveyCount = Number(
                item.survey || 
                item.survey_count || 
                item.surveyCount ||
                item.total_survey || 
                item.totalSurvey ||
                item.count || 
                item.Count ||
                item.Survey ||
                item.SurveyCount ||
                item.total ||
                item.Total ||
                0
              )
              
              console.log(`Item ${index} surveyCount:`, surveyCount, 'from fields:', {
                survey: item.survey,
                survey_count: item.survey_count,
                surveyCount: item.surveyCount,
                total_survey: item.total_survey,
                count: item.count,
                total: item.total
              })
              
              // Format date - API might return in different formats
              let formattedDate = item.date || item.Date || item.DATE || ''
              
              // If date is in YYYY-MM-DD format, convert to DD, Mon, YYYY
              if (formattedDate && formattedDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
                const dateParts = formattedDate.split('-')
                const year = dateParts[0]
                const monthIndex = parseInt(dateParts[1]) - 1
                const day = parseInt(dateParts[2])
                const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
                formattedDate = `${String(day).padStart(2, '0')}, ${monthNames[monthIndex]}, ${year}`
              }
              
              // Extract day number for ID
              let dayNumber = index + 1
              if (formattedDate) {
                const dayMatch = formattedDate.match(/^(\d+),/)
                if (dayMatch) {
                  dayNumber = parseInt(dayMatch[1])
                } else if (item.date && item.date.match(/^\d{4}-\d{2}-(\d{2})$/)) {
                  // Extract from YYYY-MM-DD format
                  const match = item.date.match(/^\d{4}-\d{2}-(\d{2})$/)
                  if (match) {
                    dayNumber = parseInt(match[1])
                  }
                }
              }
              
              const mappedItem = {
                id: item.id || item.Id || item.ID || dayNumber,
                date: formattedDate || `Day ${dayNumber}`,
                surveyCount: surveyCount,
                rawDate: item.date || item.Date || item.rawDate || formattedDate // Keep original date for reference
              }
              
              console.log(`Mapped item ${index}:`, mappedItem)
              return mappedItem
            });
          }
          console.warn('parsedData.result is not an array:', parsedData.result)
          return parsedData.result || [];
        }
        
        // Special handling for date wise survey voter endpoint
        if (soapAction === 'dis_date_wise_survey_voter') {
          console.log('Processing dis_date_wise_survey_voter response...')
          console.log('parsedData:', parsedData)
          console.log('parsedData.result:', parsedData.result)
          
          // Return the result array directly - contains voter details
          if (Array.isArray(parsedData.result)) {
            return parsedData.result.map(item => {
              // Combine first name and surname for full name
              const firstName = item.eng_f_name || item.first_name || item.f_name || ''
              const surname = item.eng_surname || item.surname || item.s_name || ''
              const fullName = `${firstName} ${surname}`.trim() || 'N/A'
              
              return {
                id: item.id || item.voter_id || item.admin_id,
                voter_id: item.id || item.voter_id,
                voterId: item.idcard_no || item.id_card_no || item.epic_no || item.voter_id || '',
                name: fullName,
                firstName: firstName,
                surname: surname,
                fatherHusband: item.eng_m_name || item.father_name || item.father_husband || item.m_name || '',
                address: item.eng_localityid || item.address || item.full_address || item.locality || '',
                mobile: item.contact_no || item.mobile_no || item.mobile || item.phone || '',
                idCardNo: item.idcard_no || item.id_card_no || item.epic_no || '',
                partNo: item.part_no || item.partNo || item.booth_no || '',
                houseNo: item.eng_house_no || item.house_no || item.house_number || '',
                pollingStation: item.eng_polling_location || item.polling_station || item.polling_location || '',
                otherAddress: item.other_address || item.dusra_pata || '-',
                serialNumber: item.slnoinpart || item.serial_no || item.serial_number || item.kramank || '',
                voterStatus: item.voter_status || item.voterStatus || '', // p, n, d, c (positive, negative, doubtful, cant_say)
                surveyId: item.survey_id || item.surveyId || '',
                latLong: item.lat_long || item.latLong || '',
                visitLocation: item.visit_location || item.visitLocation || '',
                location: item.location || item.visit_location || item.visitLocation || ''
              }
            });
          }
          return parsedData.result || [];
        }
        
        // Special handling for user wise survey voter endpoint
        if (soapAction === 'dis_user_wise_survey_voter') {
          console.log('Processing dis_user_wise_survey_voter response...')
          console.log('parsedData:', parsedData)
          console.log('parsedData.result:', parsedData.result)
          
          // Return the result array directly - contains voter details
          if (Array.isArray(parsedData.result)) {
            return parsedData.result.map((item, index) => {
              // Combine first name and surname for full name
              const firstName = item.eng_f_name || item.first_name || item.f_name || ''
              const surname = item.f_eng_surname || item.eng_surname || item.surname || item.s_name || ''
              const fullName = `${firstName} ${surname}`.trim() || 'N/A'
              
              // Extract voter status - try multiple field names and normalize
              let voterStatus = item.voter_status || item.voterStatus || item.status || item.voter_status_code || ''
              // Convert to lowercase string for consistent comparison
              if (voterStatus) {
                voterStatus = String(voterStatus).toLowerCase().trim()
              }
              
              console.log(`Voter ${index} - Name: ${fullName}, Status: ${voterStatus} (raw: ${item.voter_status || item.voterStatus})`)
              
              return {
                id: item.id || item.voter_id || item.admin_id || index,
                voter_id: item.id || item.voter_id,
                voterId: item.idcard_no || item.id_card_no || item.epic_no || item.voter_id || '',
                name: fullName,
                firstName: firstName,
                surname: surname,
                eng_f_name: firstName,
                f_eng_surname: surname,
                eng_m_name: item.eng_m_name || item.father_name || item.father_husband || item.m_name || '',
                eng_localityid: item.eng_localityid || item.address || item.full_address || item.locality || '',
                address: item.eng_localityid || item.address || item.full_address || item.locality || '',
                lat_long: item.lat_long || item.latLong || '',
                slnoinpart: item.slnoinpart || item.serial_no || item.serial_number || item.kramank || '',
                serialNo: item.slnoinpart || item.serial_no || item.serial_number || item.kramank || '',
                contact_no: item.contact_no || item.mobile_no || item.mobile || item.phone || '',
                mobile: item.contact_no || item.mobile_no || item.mobile || item.phone || '',
                idcard_no: item.idcard_no || item.id_card_no || item.epic_no || '',
                idCardNo: item.idcard_no || item.id_card_no || item.epic_no || '',
                part_no: item.part_no || item.partNo || item.booth_no || '',
                partNo: item.part_no || item.partNo || item.booth_no || '',
                booth_no: item.part_no || item.partNo || item.booth_no || '',
                eng_house_no: item.eng_house_no || item.house_no || item.house_number || '',
                houseNo: item.eng_house_no || item.house_no || item.house_number || '',
                eng_polling_location: item.eng_polling_location || item.polling_station || item.polling_location || '',
                pollingStation: item.eng_polling_location || item.polling_station || item.polling_location || '',
                add_add: item.add_add || item.other_address || item.dusra_pata || item.secondAddress || '-',
                secondAddress: item.add_add || item.other_address || item.dusra_pata || item.secondAddress || '-',
                voter_status: voterStatus,
                voterStatus: voterStatus, // p, n, d, c (positive, negative, doubtful, cant_say)
                voter_status1: voterStatus, // for backward compatibility
                surveyId: item.survey_id || item.surveyId || '',
                visitLocation: item.visit_location || item.visitLocation || '',
                location: item.location || item.visit_location || item.visitLocation || ''
              }
            });
          }
          return parsedData.result || [];
        }

        // Special handling for voter survey log endpoint
        if (soapAction === 'display_voter_survey_log') {
          if (Array.isArray(parsedData.result)) {
            return parsedData.result
          }
          return parsedData.result || []
        }

        // Special handling for survey detail endpoint
        if (soapAction === 'sel_survey_detail') {
          if (Array.isArray(parsedData.result)) {
            return parsedData.result.length === 1 ? parsedData.result[0] : parsedData.result
          }
          return parsedData.result || null
        }
        
        // Special handling for education wise survey voter endpoint
        if (soapAction === 'dis_education_wise_survey_voter') {
          // Return the result array directly - contains voter details
          if (Array.isArray(parsedData.result)) {
            return parsedData.result.map(item => {
              // Combine first name and surname for full name
              const firstName = item.eng_f_name || ''
              const surname = item.eng_surname || ''
              const fullName = `${firstName} ${surname}`.trim() || 'N/A'
              
              return {
                id: item.id || item.voter_id || item.admin_id,
                voter_id: item.id || item.voter_id,
                name: fullName,
                firstName: firstName,
                surname: surname,
                fatherHusband: item.eng_m_name || item.father_name || item.father_husband || '',
                address: item.eng_localityid || item.address || item.full_address || '',
                mobile: item.contact_no || item.mobile_no || item.mobile || item.phone || '',
                idCardNo: item.idcard_no || item.id_card_no || item.epic_no || '',
                boothNo: item.part_no || item.booth_no || item.booth_number || '',
                houseNo: item.eng_house_no || item.house_no || item.house_number || '',
                pollingStation: item.eng_polling_location || item.polling_station || item.polling_location || '',
                otherAddress: item.other_address || item.dusra_pata || '-',
                serialNumber: item.slnoinpart || item.serial_no || item.serial_number || item.kramank || '',
                voterStatus: item.voter_status || '', // p, n, d, c (positive, negative, doubtful, cant_say)
                surveyId: item.survey_id || '',
                latLong: item.lat_long || '',
                visitLocation: item.visit_location || ''
              }
            });
          }
          return parsedData.result || [];
        }
        
        // Special handling for caste wise survey voter endpoint
        if (soapAction === 'dis_cast_wise_survey_voter') {
          // Return the result array directly - contains voter details
          if (Array.isArray(parsedData.result)) {
            return parsedData.result.map(item => {
              // Combine first name and surname for full name
              const firstName = item.eng_f_name || ''
              const surname = item.eng_surname || ''
              const fullName = `${firstName} ${surname}`.trim() || 'N/A'
              
              return {
                id: item.id || item.voter_id || item.admin_id,
                voter_id: item.id || item.voter_id,
                name: fullName,
                firstName: firstName,
                surname: surname,
                fatherHusband: item.eng_m_name || item.father_name || item.father_husband || '',
                address: item.eng_localityid || item.address || item.full_address || '',
                mobile: item.contact_no || item.mobile_no || item.mobile || item.phone || '',
                idCardNo: item.idcard_no || item.id_card_no || item.epic_no || '',
                boothNo: item.part_no || item.booth_no || item.booth_number || '',
                houseNo: item.eng_house_no || item.house_no || item.house_number || '',
                pollingStation: item.eng_polling_location || item.polling_station || item.polling_location || '',
                otherAddress: item.other_address || item.dusra_pata || '-',
                serialNumber: item.slnoinpart || item.serial_no || item.serial_number || item.kramank || '',
                voterStatus: item.voter_status || '', // p, n, d, c (positive, negative, doubtful, cant_say)
                surveyId: item.survey_id || '',
                latLong: item.lat_long || '',
                visitLocation: item.visit_location || ''
              }
            });
          }
          return parsedData.result || [];
        }
        
        // Special handling for community wise survey voter endpoint (note: API has typo "commuinity")
        if (soapAction === 'dis_commuinity_wise_survey_voter') {
          // Return the result array directly - contains voter details
          if (Array.isArray(parsedData.result)) {
            return parsedData.result.map(item => {
              // Combine first name and surname for full name
              const firstName = item.eng_f_name || ''
              const surname = item.eng_surname || ''
              const fullName = `${firstName} ${surname}`.trim() || 'N/A'
              
              return {
                id: item.id || item.voter_id || item.admin_id,
                voter_id: item.id || item.voter_id,
                name: fullName,
                firstName: firstName,
                surname: surname,
                fatherHusband: item.eng_m_name || item.father_name || item.father_husband || '',
                address: item.eng_localityid || item.address || item.full_address || '',
                mobile: item.contact_no || item.mobile_no || item.mobile || item.phone || '',
                idCardNo: item.idcard_no || item.id_card_no || item.epic_no || '',
                boothNo: item.part_no || item.booth_no || item.booth_number || '',
                houseNo: item.eng_house_no || item.house_no || item.house_number || '',
                pollingStation: item.eng_polling_location || item.polling_station || item.polling_location || '',
                otherAddress: item.other_address || item.dusra_pata || '-',
                serialNumber: item.slnoinpart || item.serial_no || item.serial_number || item.kramank || '',
                voterStatus: item.voter_status || '', // p, n, d, c (positive, negative, doubtful, cant_say)
                surveyId: item.survey_id || '',
                latLong: item.lat_long || '',
                visitLocation: item.visit_location || ''
              }
            });
          }
          return parsedData.result || [];
        }
        
        // Special handling for ration card wise survey voter endpoint
        if (soapAction === 'dis_ration_card_wise_survey_voter') {
          console.log('Processing dis_ration_card_wise_survey_voter response...')
          console.log('parsedData:', parsedData)
          console.log('parsedData.result:', parsedData.result)
          
          // Return the result array directly - contains voter details
          if (Array.isArray(parsedData.result)) {
            return parsedData.result.map((item, index) => {
              // Combine first name and surname for full name
              const firstName = item.eng_f_name || item.first_name || item.f_name || ''
              const surname = item.eng_surname || item.surname || item.s_name || ''
              const fullName = `${firstName} ${surname}`.trim() || 'N/A'
              
              // Extract voter status - try multiple field names and normalize
              let voterStatus = item.voter_status || item.voterStatus || item.status || item.voter_status_code || ''
              // Convert to lowercase string for consistent comparison
              if (voterStatus) {
                voterStatus = String(voterStatus).toLowerCase().trim()
              }
              
              console.log(`Voter ${index} - Name: ${fullName}, Status: ${voterStatus} (raw: ${item.voter_status || item.voterStatus})`)
              
              return {
                id: item.id || item.voter_id || item.admin_id || index,
                voter_id: item.id || item.voter_id,
                voterId: item.idcard_no || item.id_card_no || item.epic_no || item.voter_id || '',
                name: fullName,
                firstName: firstName,
                surname: surname,
                fatherHusband: item.eng_m_name || item.father_name || item.father_husband || item.m_name || '',
                address: item.eng_localityid || item.address || item.full_address || item.locality || '',
                mobile: item.contact_no || item.mobile_no || item.mobile || item.phone || '',
                idCardNo: item.idcard_no || item.id_card_no || item.epic_no || '',
                partNo: item.part_no || item.partNo || item.booth_no || '',
                houseNo: item.eng_house_no || item.house_no || item.house_number || '',
                pollingStation: item.eng_polling_location || item.polling_station || item.polling_location || '',
                otherAddress: item.other_address || item.dusra_pata || '-',
                serialNumber: item.slnoinpart || item.serial_no || item.serial_number || item.kramank || '',
                voterStatus: voterStatus, // p, n, d, c (positive, negative, doubtful, cant_say)
                surveyId: item.survey_id || item.surveyId || '',
                latLong: item.lat_long || item.latLong || '',
                visitLocation: item.visit_location || item.visitLocation || '',
                location: item.location || item.visit_location || item.visitLocation || ''
              }
            });
          }
          return parsedData.result || [];
        }
        
        // Special handling for scheme wise survey voter endpoint
        if (soapAction === 'dis_scheme_wise_survey_voter') {
          // Return the result array directly - contains voter details
          if (Array.isArray(parsedData.result)) {
            return parsedData.result.map(item => {
              // Combine first name and surname for full name
              const firstName = item.eng_f_name || ''
              const surname = item.eng_surname || ''
              const fullName = `${firstName} ${surname}`.trim() || 'N/A'
              
              return {
                id: item.id || item.voter_id || item.admin_id,
                voter_id: item.id || item.voter_id,
                name: fullName,
                firstName: firstName,
                surname: surname,
                fatherHusband: item.eng_m_name || item.father_name || item.father_husband || '',
                address: item.eng_localityid || item.address || item.full_address || '',
                mobile: item.contact_no || item.mobile_no || item.mobile || item.phone || '',
                idCardNo: item.idcard_no || item.id_card_no || item.epic_no || '',
                boothNo: item.part_no || item.booth_no || item.booth_number || '',
                houseNo: item.eng_house_no || item.house_no || item.house_number || '',
                pollingStation: item.eng_polling_location || item.polling_station || item.polling_location || '',
                otherAddress: item.other_address || item.dusra_pata || '-',
                serialNumber: item.slnoinpart || item.serial_no || item.serial_number || item.kramank || '',
                voterStatus: item.voter_status || '', // p, n, d, c (positive, negative, doubtful, cant_say)
                surveyId: item.survey_id || '',
                latLong: item.lat_long || '',
                visitLocation: item.visit_location || ''
              }
            });
          }
          return parsedData.result || [];
        }
        
        // Special handling for booth wise survey voter endpoint
        if (soapAction === 'dis_booth_wise_survey_voter') {
          console.log('Processing dis_booth_wise_survey_voter response...')
          console.log('parsedData:', parsedData)
          console.log('parsedData.result:', parsedData.result)
          
          // Return the result array directly - contains voter details
          if (Array.isArray(parsedData.result)) {
            console.log('Processing array of', parsedData.result.length, 'voters')
            const mappedVoters = parsedData.result.map((item, index) => {
              console.log(`Processing voter ${index}:`, item)
              
              // Combine first name and surname for full name
              const firstName = item.eng_f_name || item.first_name || item.f_name || ''
              const surname = item.eng_surname || item.surname || item.s_name || ''
              const fullName = `${firstName} ${surname}`.trim() || 'N/A'
              
              const mappedVoter = {
                id: item.id || item.voter_id || item.admin_id || `voter-${index}`,
                voter_id: item.id || item.voter_id,
                name: fullName,
                firstName: firstName,
                surname: surname,
                fatherHusband: item.eng_m_name || item.father_name || item.father_husband || item.m_name || '',
                address: item.eng_localityid || item.address || item.full_address || item.locality || '',
                mobile: item.contact_no || item.mobile_no || item.mobile || item.phone || item.contact || '',
                idCardNo: item.idcard_no || item.id_card_no || item.epic_no || item.epic || '',
                boothNo: item.part_no || item.booth_no || item.booth_number || item.booth || '',
                houseNo: item.eng_house_no || item.house_no || item.house_number || item.house || '',
                pollingStation: item.eng_polling_location || item.polling_station || item.polling_location || item.polling || '',
                otherAddress: item.other_address || item.dusra_pata || item.second_address || '-',
                serialNumber: item.slnoinpart || item.serial_no || item.serial_number || item.kramank || item.slno || '',
                voterStatus: item.voter_status || item.status || '', // p, n, d, c (positive, negative, doubtful, cant_say)
                surveyId: item.survey_id || '',
                latLong: item.lat_long || '',
                visitLocation: item.visit_location || ''
              }
              
              console.log(`Mapped voter ${index}:`, mappedVoter)
              return mappedVoter
            });
            
            console.log('Mapped voters:', mappedVoters)
            return mappedVoters
          }
          
          console.warn('parsedData.result is not an array:', parsedData.result)
          return parsedData.result || [];
        }
        
        // Special handling for admin survey dashboard endpoint
        if (soapAction === 'dis_admin_survey_dashboard') {
          // Combine all three result arrays into a single object
          const combinedData = {};
          
          console.log('Parsing dis_admin_survey_dashboard response...');
          console.log('parsedData:', parsedData);
          console.log('parsedData.result:', parsedData.result);
          console.log('parsedData.result2:', parsedData.result2);
          console.log('parsedData.result3:', parsedData.result3);
          
          // Extract data from result array (total_voter, total_survey, not_available)
          if (Array.isArray(parsedData.result) && parsedData.result.length > 0) {
            Object.assign(combinedData, parsedData.result[0]);
            console.log('Extracted from result:', parsedData.result[0]);
          }
          
          // Extract data from result2 array (P, N, D, C)
          // P - positive, N - negative, D - doubtful, C - cant say
          if (Array.isArray(parsedData.result2) && parsedData.result2.length > 0) {
            const result2Data = parsedData.result2[0];
            console.log('Extracting from result2:', result2Data);
            combinedData.positive = result2Data.P !== undefined ? result2Data.P : 0;
            combinedData.negative = result2Data.N !== undefined ? result2Data.N : 0;
            combinedData.doubtful = result2Data.D !== undefined ? result2Data.D : 0;
            combinedData.cant_say = result2Data.C !== undefined ? result2Data.C : 0;
            // Keep 'nothing' for backward compatibility
            combinedData.nothing = result2Data.C !== undefined ? result2Data.C : 0;
            console.log('Mapped result2:', { positive: combinedData.positive, negative: combinedData.negative, doubtful: combinedData.doubtful, cant_say: combinedData.cant_say });
          }
          
          // Extract data from result3 array (AP, SP, BP, PP, PH)
          // AP - address pramukh, SP - shakti kendra, BP - booth pramukh, PP - ?, PH - phonebook
          if (Array.isArray(parsedData.result3) && parsedData.result3.length > 0) {
            const result3Data = parsedData.result3[0];
            console.log('Extracting from result3:', result3Data);
            console.log('result3[0].AP:', result3Data.AP);
            console.log('result3[0].SP:', result3Data.SP);
            console.log('result3[0].BP:', result3Data.BP);
            console.log('result3[0].PP:', result3Data.PP);
            console.log('result3[0].PH:', result3Data.PH);
            
            // Correct mapping based on user's clarification
            combinedData.address_pramukh = result3Data.AP !== undefined ? result3Data.AP : 0;
            combinedData.shakti_kendra = result3Data.SP !== undefined ? result3Data.SP : 0;
            combinedData.booth_pramukh = result3Data.BP !== undefined ? result3Data.BP : 0;
            combinedData.other_survey = result3Data.PP !== undefined ? result3Data.PP : 0; // PP not specified by user
            combinedData.phonebook = result3Data.PH !== undefined ? result3Data.PH : 0;
            
            console.log('Mapped result3:', { 
              address_pramukh: combinedData.address_pramukh,
              shakti_kendra: combinedData.shakti_kendra, 
              booth_pramukh: combinedData.booth_pramukh, 
              other_survey: combinedData.other_survey,
              phonebook: combinedData.phonebook
            });
          } else {
            console.warn('result3 is not an array or is empty:', parsedData.result3);
          }
          
          console.log('Final combinedData:', combinedData);
          return combinedData;
        }
        
          if (soapAction === 'display_corporation_wise_panel') {
            // Transform panel data and save API URL to localStorage
            const transformedPanels = parsedData.result.map(panel => ({
              id: panel.panel_no,
              name: panel.panel_name,
              voters: panel.total_voter || 0,
              copyId: panel.copy_id,
              corporationId: panel.corporation_id,
              corporationName: panel.corporation_name,
              apiUrl: panel.api_url,
              candidateName: panel.candidate_name,
              candidateNo: panel.candidate_no,
              splaceUrl: panel.splace_url,
              slipMsg: panel.slip_msg,
              appLink: panel.app_link,
              appVer: panel.app_ver,
              offline: panel.offline,
              offlineDbUrl: panel.offline_db_url,
              liveVoting: panel.live_voting,
              isOnlySlip: panel.is_only_slip,
              callCenterModule: panel.call_center_module,
              videoLink: panel.video_link,
              prachar: panel.prachar,
              active: panel.active,
              status: panel.status
            }));
            
            // Save the first panel's API URL to localStorage for future use
            if (transformedPanels.length > 0 && transformedPanels[0].apiUrl) {
              try {
                localStorageManager.updateSession({ apiUrl: transformedPanels[0].apiUrl });
                console.log('API URL saved to localStorage:', transformedPanels[0].apiUrl);
              } catch (error) {
                console.warn('Failed to save API URL to localStorage:', error);
              }
            }
            
            return transformedPanels;
          } else if (soapAction === 'admin_login') {
            // Transform admin login data
            return parsedData.result.map(admin => ({
              adminId: admin.admin_id,
              type: admin.type,
              subType: admin.sub_type,
              mainAdminId: admin.main_admin_id,
              name: admin.name,
              mobileNo: admin.mobile_no,
              photo: admin.photo,
              photoPath: admin.photo_path,
              idcardNo: admin.idcard_no,
              boothJavabdari: admin.booth_javabdari,
              tempStatus: admin.temp_status,
              otp: admin.otp
            }));
          } else if (soapAction === 'display_admin') {
            // Transform admin display data
            return parsedData.result.map(admin => ({
              adminId: admin.admin_id,
              type: admin.type,
              subType: admin.sub_type,
              mainAdminId: admin.main_admin_id,
              name: admin.name,
              mobileNo: admin.mobile_no,
              photo: admin.photo,
              photoPath: admin.photo_path,
              idcardNo: admin.idcard_no,
              tempStatus: admin.temp_status,
              lastLogin: admin.last_login
            }));
          } else if (soapAction === 'dis_sub_admin') {
            // Transform sub-admin display data
            return parsedData.result.map(subAdmin => ({
              adminId: subAdmin.admin_id,
              type: subAdmin.type,
              subType: subAdmin.sub_type,
              mainAdminId: subAdmin.main_admin_id,
              name: subAdmin.name,
              mobileNo: subAdmin.mobile_no,
              photo: subAdmin.photo,
              photoPath: subAdmin.photo_path,
              idcardNo: subAdmin.idcard_no,
              tempStatus: subAdmin.temp_status,
              lastLogin: subAdmin.last_login
            }));
          } else if (soapAction === 'display_volunteer') {
            // Transform volunteer/karyakarta display data
            return parsedData.result.map(volunteer => ({
              adminId: volunteer.admin_id,
              type: volunteer.type,
              subType: volunteer.sub_type,
              mainAdminId: volunteer.main_admin_id,
              name: volunteer.name,
              mobileNo: volunteer.mobile_no,
              photo: volunteer.photo,
              photoPath: volunteer.photo_path,
              idcardNo: volunteer.idcard_no,
              tempStatus: volunteer.temp_status,
              lastLogin: volunteer.last_login
            }));
          } else if (soapAction === 'display_sakti_kendra_parmukh') {
            // Transform Shakti Kendra Pramukh display data
            return parsedData.result.map(pramukh => ({
              adminId: pramukh.admin_id,
              type: pramukh.type,
              name: pramukh.name,
              mobileNo: pramukh.mobile_no,
              photo: pramukh.photo,
              photoPath: pramukh.photo_path,
              boothNo: pramukh.booth_no,
              lastLogin: pramukh.last_login
            }));
          } else if (soapAction === 'display_call_center') {
            // Transform Call Center display data
            return parsedData.result.map(callCenter => ({
              adminId: callCenter.admin_id,
              type: callCenter.type,
              name: callCenter.name,
              mobileNo: callCenter.mobile_no,
              photo: callCenter.photo,
              photoPath: callCenter.photo_path,
              boothNo: callCenter.booth_no,
              lastLogin: callCenter.last_login
            }));
          } else if (soapAction === 'display_booth_pramukh') {
            // Transform Booth Pramukh display data
            return parsedData.result.map(booth => ({
              boothNo: booth.booth_no,
              voterCount: booth.voter_count,
              totalBoothPramukh: booth.total_booth_pramukh,
              photoPath: booth.photo_path,
              mobileNo: booth.mobile_no
            }));
          } else if (soapAction === 'dis_all_booth_with_all_total') {
            // Transform All Booth with Total display data
            return parsedData.result.map(booth => ({
              boothNo: booth.booth_no,
              totalVoters: booth.total_voters || booth.voter_count
            }));
          } else if (soapAction === 'display_booth_wise_voter') {
            // Transform Booth Wise Voter display data - extract घर नं: as eng_house_no
            return parsedData.result.map(voter => {
              const houseNumber = this.extractHouseNumber(voter);
              return {
                ...voter,
                eng_house_no: houseNumber,
                // Ensure all required fields are present with proper mapping
                id: voter.id || voter.voter_id || voter.serial_no,
                serialNumber: voter.serialNumber || voter.slnoinpart || voter.serial_no,
                name: voter.name || `${voter.eng_f_name || ''} ${voter.f_eng_surname || ''}`.trim(),
                fatherHusbandName: voter.fatherHusbandName || voter.eng_m_name || voter.father_name,
                address: voter.address || voter.eng_localityid || voter.locality,
                mobileNumber: voter.mobileNumber || voter.contact_no || voter.mobile_no,
                idCardNumber: voter.idCardNumber || voter.idcard_no || voter.voter_id,
                boothNumber: voter.boothNumber || voter.part_no || voter.booth_no,
                houseNumber: houseNumber,
                pollingStation: voter.pollingStation || voter.eng_polling_location || voter.polling_station
              };
            });
          } else if (soapAction === 'display_sakti_pramukh_cadre') {
            // Transform Shakti Pramukh Cadre display data
            return parsedData.result.map(cadre => ({
              adminId: cadre.admin_id,
              type: cadre.type,
              subType: cadre.sub_type,
              designation: cadre.designation,
              name: cadre.name,
              mobileNo: cadre.mobile_no,
              photo: cadre.photo,
              photoPath: cadre.photo_path,
              lastLogin: cadre.last_login
            }));
          } else if (soapAction === 'display_booth_pramukh_by_sakti_pramukh') {
            // Transform Booth Pramukh by Shakti Pramukh display data
            return parsedData.result.map(booth => ({
              id: booth.booth_no,
              number: booth.booth_no,
              voters: booth.voter_count,
              totalBoothPramukh: booth.total_booth_pramukh,
              photoPath: booth.photo_path,
              assigned: booth.total_booth_pramukh > 0
            }));
          } else if (soapAction === 'display_booth_pramukh_cadre') {
            // Transform Booth Pramukh Cadre display data
            return parsedData.result.map(cadre => ({
              id: cadre.admin_id,
              name: cadre.name,
              phone: cadre.mobile_no,
              role: cadre.designation,
              status: cadre.last_login ? 'active' : 'inactive',
              profileImage: cadre.photo_path || null,
              adminId: cadre.admin_id,
              type: cadre.type,
              sub_type: cadre.sub_type, // Keep snake_case
              subType: cadre.sub_type,  // Also include camelCase for compatibility
              designation: cadre.designation,
              mobile: cadre.mobile_no,
              mobile_no: cadre.mobile_no,
              phoneNumber: cadre.mobile_no,
              boothNo: cadre.booth_no,
              booth_no: cadre.booth_no,
              lastLogin: cadre.last_login,
              last_login: cadre.last_login,
              photo_path: cadre.photo_path,
              photoPath: cadre.photo_path
            }));

          } else if (soapAction === 'dis_building_pramukh') {
            // Transform Building Pramukh data
            const mapped = parsedData.result.map((item, idx) => {
              const addresses = (item.building_list || '')
                .split('%')
                .map(s => s.trim())
                .filter(Boolean);

              const rawPhotoPath = item.photo_path || ''
              const rawPhoto = item.photo || ''
              let profileImage = null

              if (rawPhotoPath && rawPhoto) {
                profileImage = `${rawPhotoPath}${rawPhoto}`
              } else if (rawPhoto && rawPhoto.trim().startsWith('data:image')) {
                profileImage = rawPhoto.trim()
              } else if (rawPhoto && /^[A-Za-z0-9+/=]+$/.test(rawPhoto) && rawPhoto.length > 50) {
                profileImage = `data:image/jpeg;base64,${rawPhoto}`
              }

              return {
                id: item.admin_id ?? idx,
                name: item.name || '—',
                addresses,
                addressCount: Number(item.building_count || addresses.length || 0),
                voters: Number(item.total_voter || 0),
                status: (Number(item.building_count || 0) > 0) ? 'active' : 'inactive',
                phoneNumber: item.mobile_no || '',
                profileImage,
                photoPath: rawPhotoPath,
                photo: rawPhoto,
                lastLogin: item.last_login || '',
                last_login: item.last_login || '' // Include both camelCase and snake_case for compatibility
              };
            });
            const summaryRow = (parsedData.result2 && parsedData.result2[0]) ? parsedData.result2[0] : { total_address: 0, matched_address: 0 };
            return {
              list: mapped,
              summary: {
                total_address: Number(summaryRow.total_address || 0),
                matched_address: Number(summaryRow.matched_address || 0)
              }
            };

          } else if (soapAction === 'dis_building_pramukh_cadre_with_voter') {
            // Transform Building Pramukh Cadre with Voter data
            // result array contains both building pramukh and co-incharges
            // Building pramukh: type="AP", sub_type="AP" (or no sub_type, or first item that's not AS)
            // Co-incharges: type="AP", sub_type="AS"
            
            let buildingPramukh = null;
            const coIncharge = [];
            
            if (parsedData.result && Array.isArray(parsedData.result)) {
              // First, extract co-incharges (type="AP", sub_type="AS")
              parsedData.result.forEach(item => {
                const type = (item.type || '').toUpperCase();
                const subType = (item.sub_type || '').toUpperCase();
                if (type === 'AP' && subType === 'AS') {
                  coIncharge.push({
                    id: item.admin_id,
                    admin_id: item.admin_id,
                    name: item.name,
                    phone: item.mobile_no,
                    mobile_no: item.mobile_no,
                    mobile: item.mobile_no,
                    phoneNumber: item.mobile_no,
                    role: item.designation || 'बिल्डिंग सह इनचार्ज',
                    designation: item.designation || 'बिल्डिंग सह इनचार्ज',
                    photo: item.photo,
                    photo_path: item.photo_path,
                    photoPath: item.photo_path,
                    profileImage: item.photo_path,
                    last_login: item.last_login,
                    lastLogin: item.last_login,
                    status: item.last_login ? 'active' : 'inactive',
                    type: item.type,
                    sub_type: item.sub_type,
                    subType: item.sub_type
                  });
                }
              });
              
              // Find building pramukh (type="AP", sub_type="AP")
              const buildingPramukhItem = parsedData.result.find(item => {
                const type = (item.type || '').toUpperCase();
                const subType = (item.sub_type || '').toUpperCase();
                // Building pramukh is AP/AP
                return (type === 'AP' && subType === 'AP');
              }) || (parsedData.result.length > 0 && coIncharge.length < parsedData.result.length ? parsedData.result[0] : null);
              
              if (buildingPramukhItem) {
                // Only set as building pramukh if it's not already in co-incharge list
                const isCoIncharge = coIncharge.some(ci => ci.admin_id === buildingPramukhItem.admin_id);
                if (!isCoIncharge) {
                  buildingPramukh = {
                    id: buildingPramukhItem.admin_id,
                    name: buildingPramukhItem.name,
                    phoneNumber: buildingPramukhItem.mobile_no,
                    designation: buildingPramukhItem.designation,
                    photo: buildingPramukhItem.photo,
                    photoPath: buildingPramukhItem.photo_path,
                    lastLogin: buildingPramukhItem.last_login,
                    status: 'active'
                  };
                }
              }
            }

            const voters = parsedData.result2 ? parsedData.result2.map(voter => ({
              id: voter.id,
              eng_f_name: voter.eng_f_name,
              f_eng_surname: voter.f_eng_surname,
              eng_m_name: voter.eng_m_name,
              eng_surname: voter.eng_surname,
              part_no: voter.part_no,
              eng_localityid: voter.eng_localityid,
              booth_no: voter.booth_no,
              contact_no: voter.contact_no,
              idcard_no: voter.idcard_no,
              slnoinpart: voter.slnoinpart,
              eng_polling_location: voter.eng_polling_location,
              sex: voter.sex,
              age: voter.age,
              eng_house_no: voter.eng_house_no,
              add_add: voter.add_add,
              voter_status: voter.voter_status,
              survey_id: voter.survey_id,
              survey_by_id: voter.survey_by_id,
              survey_by: voter.survey_by,
              voter_status1: voter.voter_status1,
              lat_long: voter.lat_long,
              visit_location: voter.visit_location,
              voter_available: voter.voter_available,
              not_available_status: voter.not_available_status || ''
            })) : [];

            // Extract address data from result3 (addresses with notes and remarks)
            const addressData = parsedData.result3 && Array.isArray(parsedData.result3) 
              ? parsedData.result3.map(item => ({
                  address: item.add || '',
                  total_voter: item.total_voter || 0,
                  note: item.note || '',
                  remark: item.remark || ''
                }))
              : [];

            return {
              buildingPramukh,
              coIncharge,
              buildingPramukhCadre: parsedData.result || [], // Keep raw data for backward compatibility
              voters,
              addressData // Add address data from result3
            };

          } else if (soapAction === 'dis_booth_pramukh_wise_voter') {
            // Transform Booth Pramukh Wise Voter data
            return parsedData.result.map(voter => {
              const s1 = ((voter.voter_status ?? '') + '').trim().toLowerCase();
              const s2 = ((voter.voter_status1 ?? '') + '').trim().toLowerCase();
              const isVisited = (s1 === 'p' || s1 === 'd' || s2 === 'p' || s2 === 'd');
              return {
                id: voter.id,
                serialNo: voter.slnoinpart,
                name: `${voter.eng_f_name || ''} ${voter.f_eng_surname || ''}`.trim() || '-',
                fatherHusband: voter.eng_m_name && voter.eng_m_name.trim() ? voter.eng_m_name : '-',
                address: voter.eng_localityid && voter.eng_localityid.trim() ? voter.eng_localityid : '-',
                voterId: voter.idcard_no && voter.idcard_no.trim() ? voter.idcard_no : '-',
                boothNo: voter.part_no || voter.booth_no,
                houseNo: voter.eng_house_no && voter.eng_house_no.trim() ? voter.eng_house_no : '-',
                pollingStation: voter.eng_polling_location && voter.eng_polling_location.trim() ? voter.eng_polling_location : '-',
                secondAddress: voter.add_add && voter.add_add.trim() && voter.add_add !== '-' ? voter.add_add : '-',
                mobile: voter.contact_no && voter.contact_no.trim() && voter.contact_no !== '-' ? voter.contact_no : '-',
                surname: voter.eng_surname || voter.f_eng_surname || '',
                last_name: voter.eng_surname || voter.f_eng_surname || '',
                sex: voter.sex || '',
                voterStatus: voter.voter_status || '',
                surveyId: voter.survey_id || '',
                surveyById: voter.survey_by_id || '',
                surveyBy: voter.survey_by || '',
                voterStatus1: voter.voter_status1 || '',
                latLong: voter.lat_long || '',
                visitLocation: voter.visit_location || '',
                note: voter.note || '',
                visited: isVisited,
                is_visited: isVisited,
                voter_available: voter.voter_available,
                not_available_status: voter.not_available_status || ''
              };
            });

        } else if (soapAction === 'display_all_booth_for_sakti_allocation') {
          return parsedData.result;
          } else {
            // Transform corporation data
            return parsedData.result.map(corp => ({
              id: corp.corporation_id,
              name: corp.corporation_name,
              englishName: this.getEnglishName(corp.corporation_name)
            }));
          }
        } else {
          // Handle Success="0" for certain endpoints - return empty array instead of error
          if (parsedData.Success === "0") {
            // For display endpoints, Success="0" usually means no data found, which is valid
            if (soapAction === 'display_booth_pramukh_cadre' || 
                soapAction === 'display_booth_pramukh_by_sakti_pramukh' ||
                soapAction === 'display_voter_survey_log' ||
                soapAction === 'display_all_phonebook_match_admin' ||
                soapAction === 'display_phonebook_member') {
              return [];
            }
          }
          throw new Error(`API returned unsuccessful response: ${JSON.stringify(parsedData)}`);
        }
      }
      throw new Error('Invalid SOAP response format - no result found');
    } catch (error) {
      console.error('Error parsing SOAP response:', error);
      throw error;
    }
  },

  // Function to get English name for corporation
  getEnglishName(hindiName) {
    const nameMapping = {
      'बृहन्मुंबई महानगरपालिका': 'Brihanmumbai Municipal Corporation',
      'ठाणे महानगरपालिका': 'Thane Municipal Corporation',
      'पुणे महानगरपालिका': 'Pune Municipal Corporation',
      'नागपुर महानगरपालिका': 'Nagpur Municipal Corporation',
      'अमरावती महानगरपालिका': 'Amravati Municipal Corporation',
      'चंद्रपुर महानगरपालिका': 'Chandrapur Municipal Corporation'
    };
    return nameMapping[hindiName] || hindiName;
  },

  // Function to extract house number from various possible field names
  extractHouseNumber(voterData) {
    // Try different possible field names for house number
    const possibleFields = [
      'eng_house_no',
      'घर नं:',
      'house_no',
      'houseNumber',
      'house_number',
      'ghar_no',
      'घर_नं'
    ];
    
    for (const field of possibleFields) {
      if (voterData[field] && voterData[field].toString().trim()) {
        return voterData[field].toString().trim();
      }
    }
    
    return '';
  },

  // Display all copy per
  displayAllCopyPer: async function() {
    return this.makeRequest(API_ENDPOINTS.DISPLAY_ALL_COPY_PER);
  },

  // Display all corporation
  displayAllCorporation: async function() {
    try {
      const soapBody = `<display_all_corporation xmlns="http://tempuri.org/" />`;
      
      console.log('Calling displayAllCorporation with endpoint:', API_ENDPOINTS.DISPLAY_ALL_CORPORATION);
      console.log('displayAllCorporation - soapBody:', soapBody);
      
      return await this.makeRequest(
        API_ENDPOINTS.DISPLAY_ALL_CORPORATION, 
        'POST', 
        'display_all_corporation',
        soapBody
      );
    } catch (error) {
      console.error('Error in displayAllCorporation:', error);
      throw error;
    }
  },

  // Display corporation wise panel
  displayCorporationWisePanel: async function(corporationId) {
    // Ensure corporationId is a valid number
    const corpId = parseInt(corporationId);
    if (isNaN(corpId) || corpId <= 0) {
      throw new Error(`Invalid corporation ID: ${corporationId}`);
    }
    
    const soapBody = `<display_corporation_wise_panel xmlns="http://tempuri.org/">
      <corporation_id>${corpId}</corporation_id>
    </display_corporation_wise_panel>`;
    
    console.log('displayCorporationWisePanel - corporationId:', corporationId);
    console.log('displayCorporationWisePanel - corpId parsed:', corpId);
    console.log('displayCorporationWisePanel - endpoint:', API_ENDPOINTS.DISPLAY_CORPORATION_WISE_PANEL);
    console.log('displayCorporationWisePanel - soapBody:', soapBody);
    
    return this.makeRequest(
      API_ENDPOINTS.DISPLAY_CORPORATION_WISE_PANEL, 
      'POST', 
      'display_corporation_wise_panel',
      soapBody
    );
  },

  // Select copy
  selectCopy: async function(copyId) {
    const endpoint = copyId 
      ? `${API_ENDPOINTS.SELECT_COPY}?copyId=${copyId}`
      : API_ENDPOINTS.SELECT_COPY;
    return this.makeRequest(endpoint);
  },

  // Select copy per
  selectCopyPer: async function(copyPerId) {
    const endpoint = copyPerId 
      ? `${API_ENDPOINTS.SELECT_COPY_PER}?copyPerId=${copyPerId}`
      : API_ENDPOINTS.SELECT_COPY_PER;
    return this.makeRequest(endpoint);
  },

  // Admin login function
  adminLogin: async function(mobileNo, panelApiUrl, isLogin = "1", deviceId = "") {
    const soapBody = `<admin_login xmlns="http://tempuri.org/">
      <mobile_no>${mobileNo}</mobile_no>
      <is_login>${isLogin}</is_login>
      <device_id>${deviceId}</device_id>
    </admin_login>`;
    
    // Use helper function to get admin endpoint
    const adminEndpoint = getAdminEndpoint(panelApiUrl);
    
    return this.makeRequest(
      adminEndpoint,
      'POST', 
      'admin_login',
      soapBody,
      true // Use admin authentication
    );
  },

  // Display admin function
  displayAdmin: async function(panelApiUrl) {
    const soapBody = `<display_admin xmlns="http://tempuri.org/" />`;
    
    // Use helper function to get admin endpoint
    const adminEndpoint = getAdminEndpoint(panelApiUrl);
    
    return this.makeRequest(
      adminEndpoint,
      'POST', 
      'display_admin',
      soapBody,
      true // Use admin authentication
    );
  },

  // Display sub-admin function
  displaySubAdmin: async function(panelApiUrl) {
    const soapBody = `<dis_sub_admin xmlns="http://tempuri.org/" />`;
    
    // Use helper function to get admin endpoint
    const adminEndpoint = getAdminEndpoint(panelApiUrl);
    
    return this.makeRequest(
      adminEndpoint,
      'POST', 
      'dis_sub_admin',
      soapBody,
      true // Use admin authentication
    );
  },

  // Display volunteer/karyakarta function
  displayVolunteer: async function(panelApiUrl) {
    const soapBody = `<display_volunteer xmlns="http://tempuri.org/" />`;
    
    // Use helper function to get admin endpoint
    const adminEndpoint = getAdminEndpoint(panelApiUrl);
    
    return this.makeRequest(
      adminEndpoint,
      'POST', 
      'display_volunteer',
      soapBody,
      true // Use admin authentication
    );
  },

  // Display Shakti Kendra Pramukh function
  displayShaktiKendraPramukh: async function(panelApiUrl) {
    const soapBody = `<display_sakti_kendra_parmukh xmlns="http://tempuri.org/" />`;
    
    // Use helper function to get admin endpoint
    const adminEndpoint = getAdminEndpoint(panelApiUrl);
    
    return this.makeRequest(
      adminEndpoint,
      'POST', 
      'display_sakti_kendra_parmukh',
      soapBody,
      true // Use admin authentication
    );
  },

  // Display Call Center function
  displayCallCenter: async function(panelApiUrl) {
    const soapBody = `<display_call_center xmlns="http://tempuri.org/" />`;
    
    // Use helper function to get admin endpoint
    const adminEndpoint = getAdminEndpoint(panelApiUrl);
    
    return this.makeRequest(
      adminEndpoint,
      'POST', 
      'display_call_center',
      soapBody,
      true // Use admin authentication
    );
  },

  // Test function to verify authentication
  testAuth: async function(panelApiUrl) {
    const soapBody = `<display_admin xmlns="http://tempuri.org/" />`;
    
    // Use helper function to get admin endpoint
    const adminEndpoint = getAdminEndpoint(panelApiUrl);
    
    console.log('Testing authentication with endpoint:', adminEndpoint);
    
    return this.makeRequest(
      adminEndpoint,
      'POST', 
      'display_admin',
      soapBody,
      true // Use admin authentication
    );
  },

  // Insert admin function - supports both BP (Booth Head) and AP (Building Pramukh)
  insertAdmin: async function(adminData, panelApiUrl) {
    const {
      type = 'AP', // Default to AP for Building Pramukh
      sub_type = 'AP',
      main_admin_id = '0',
      name = '',
      mobile_no = '',
      photo = '',
      base64 = '',
      add = '',
      booth_javabdari = '0',
      page_javabdari = '',
      idcard_no = '',
      create_by = '1' // Default to '1' if not provided
    } = adminData;

    // Validate required fields
    if (!name || !mobile_no) {
      throw new Error('Name and mobile number are required');
    }

    // Escape XML special characters
    const escapeXml = (str) => {
      if (!str) return '';
      return str.toString()
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    };

    // Type-specific validation and defaults
    let finalType = type;
    let finalSubType = sub_type;
    let finalMainAdminId = (adminData && adminData.main_admin_id != null)
      ? String(adminData.main_admin_id).trim() || '0'
      : String(main_admin_id).trim() || '0';
    let finalBoothJavabdari = booth_javabdari;
    let finalPageJavabdari = page_javabdari || '0';
    let finalIdcardNo = idcard_no || '0';
    let finalAdd = '';

    if (type === 'BP') {
      // Booth Head: booth_javabdari is required, add is empty
      if (!booth_javabdari || booth_javabdari === '0') {
        throw new Error('Booth number is required for Booth Head');
      }
      finalAdd = '';
    } else if (type === 'AP') {
      // Building Pramukh or Building Co-incharge
      if (sub_type === 'AS') {
        // Building Co-incharge: add can be empty, booth_javabdari is 0
        finalAdd = '';
        finalBoothJavabdari = '0';
      } else {
        // Building Pramukh: add (addresses) is required, booth_javabdari is 0
        const cleanAddress = add ? add.toString().trim() : '';
        if (!cleanAddress) {
          throw new Error('At least one address is required for Building Pramukh');
        }
        finalAdd = cleanAddress;
        finalBoothJavabdari = '0';
      }
    }

    // Use provided create_by or default to '1'
    const finalCreateBy = create_by ? String(create_by).trim() : '1';

    const soapBody = `<insert_admin xmlns="http://tempuri.org/">
      <type>${escapeXml(finalType)}</type>
      <sub_type>${escapeXml(finalSubType)}</sub_type>
      <main_admin_id>${escapeXml(finalMainAdminId)}</main_admin_id>
      <name>${escapeXml(name)}</name>
      <mobile_no>${escapeXml(mobile_no)}</mobile_no>
      <photo>${escapeXml(photo)}</photo>
      <base64>${escapeXml(base64)}</base64>
      <idcard_no>${escapeXml(finalIdcardNo)}</idcard_no>
      <booth_javabdari>${escapeXml(finalBoothJavabdari)}</booth_javabdari>
      <page_javabdari>${escapeXml(finalPageJavabdari)}</page_javabdari>
      <add>${escapeXml(finalAdd)}</add>
      <create_by>${escapeXml(finalCreateBy)}</create_by>
    </insert_admin>`;
    
    console.log('Insert Admin Data:', adminData);
    console.log('SOAP Body:', soapBody);
    
    // Use helper function to get admin endpoint
    const adminEndpoint = getAdminEndpoint(panelApiUrl);
    
    console.log('Final endpoint:', adminEndpoint);
    
    return this.makeRequest(
      adminEndpoint,
      'POST', 
      'insert_admin',
      soapBody,
      true // Use admin authentication
    );
  },

  // Update admin function
  updateAdmin: async function(adminData, panelApiUrl) {
    const {
      admin_id,
      type = 'A',
      sub_type = 'A',
      name = '',
      mobile_no = '',
      photo = '',
      base64 = '',
      idcard_no = '',
      booth_javabdari = '0',
      page_javabdari = '',
      add = '',
      modify_by = '1' // Default to '1' if not provided
    } = adminData;

    // Validate required fields
    if (!admin_id) {
      throw new Error('Admin ID is required for update');
    }
    // Skip name/mobile validation for delete operations (when both type and sub_type are 'D')
    const isDeleteOperation = type === 'D' && sub_type === 'D';
    if (!isDeleteOperation && (!name || !mobile_no)) {
      throw new Error('Name and mobile number are required');
    }

    // Escape XML special characters
    const escapeXml = (str) => {
      if (!str) return '';
      return str.toString()
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    };

    const soapBody = `<update_admin xmlns="http://tempuri.org/">
      <admin_id>${escapeXml(String(admin_id))}</admin_id>
      <type>${escapeXml(type)}</type>
      <sub_type>${escapeXml(sub_type)}</sub_type>
      <name>${escapeXml(name)}</name>
      <mobile_no>${escapeXml(mobile_no)}</mobile_no>
      <photo>${escapeXml(photo)}</photo>
      <base64>${escapeXml(base64)}</base64>
      <idcard_no>${escapeXml(idcard_no || '')}</idcard_no>
      <booth_javabdari>${escapeXml(booth_javabdari || '0')}</booth_javabdari>
      <page_javabdari>${escapeXml(page_javabdari || '')}</page_javabdari>
      <add>${escapeXml(add || '')}</add>
      <modify_by>${escapeXml(String(modify_by))}</modify_by>
    </update_admin>`;
    
    console.log('Update Admin Data:', adminData);
    console.log('SOAP Body:', soapBody);
    
    // Use helper function to get admin endpoint
    const adminEndpoint = getAdminEndpoint(panelApiUrl);
    
    console.log('Final endpoint:', adminEndpoint);
    
    return this.makeRequest(
      adminEndpoint,
      'POST', 
      'update_admin',
      soapBody,
      true // Use admin authentication
    );
  },

  // Display Booth Pramukh function
  displayBoothPramukh: async function(panelApiUrl) {
    const soapBody = `<display_booth_pramukh xmlns="http://tempuri.org/" />`;
    
    // Use helper function to get admin endpoint
    const adminEndpoint = getAdminEndpoint(panelApiUrl);
    
    return this.makeRequest(
      adminEndpoint,
      'POST', 
      'display_booth_pramukh',
      soapBody,
      true // Use admin authentication
    );
  },

  // Display All Booth with All Total function
  displayAllBoothWithAllTotal: async function(panelApiUrl) {
    const soapBody = `<dis_all_booth_with_all_total xmlns="http://tempuri.org/" />`;
    
    // Use helper function to get admin endpoint
    const adminEndpoint = getAdminEndpoint(panelApiUrl);
    
    return this.makeRequest(
      adminEndpoint,
      'POST', 
      'dis_all_booth_with_all_total',
      soapBody,
      true // Use admin authentication
    );
  },

  // Display Booth Wise Voter function
  displayBoothWiseVoter: async function(boothNo, panelApiUrl) {
    const soapBody = `<display_booth_wise_voter xmlns="http://tempuri.org/">
      <booth_no>${boothNo}</booth_no>
    </display_booth_wise_voter>`;
    
    // Use helper function to get admin endpoint
    const adminEndpoint = getAdminEndpoint(panelApiUrl);
    
    return this.makeRequest(
      adminEndpoint,
      'POST', 
      'display_booth_wise_voter',
      soapBody,
      true // Use admin authentication
    );
  },

  // Display Shakti Pramukh Cadre function
  displaySaktiPramukhCadre: async function(mainAdminId, panelApiUrl) {
    const soapBody = `<display_sakti_pramukh_cadre xmlns="http://tempuri.org/">
      <main_admin_id>${mainAdminId}</main_admin_id>
    </display_sakti_pramukh_cadre>`;
    
    // Use helper function to get admin endpoint
    const adminEndpoint = getAdminEndpoint(panelApiUrl);
    
    return this.makeRequest(
      adminEndpoint,
      'POST', 
      'display_sakti_pramukh_cadre',
      soapBody,
      true // Use admin authentication
    );
  },

  // Display Booth Pramukh by Shakti Pramukh function
  displayBoothPramukhBySaktiPramukh: async function(mainAdminId, panelApiUrl) {
    const soapBody = `<display_booth_pramukh_by_sakti_pramukh xmlns="http://tempuri.org/">
      <main_admin_id>${mainAdminId}</main_admin_id>
    </display_booth_pramukh_by_sakti_pramukh>`;
    
    // Use helper function to get admin endpoint
    const adminEndpoint = getAdminEndpoint(panelApiUrl);
    
    return this.makeRequest(
      adminEndpoint,
      'POST', 
      'display_booth_pramukh_by_sakti_pramukh',
      soapBody,
      true // Use admin authentication
    );
  },

  // Display Booth Pramukh Cadre function
  displayBoothPramukhCadre: async function(boothNo, panelApiUrl) {
    const soapBody = `<display_booth_pramukh_cadre xmlns="http://tempuri.org/">
      <booth_no>${boothNo}</booth_no>
    </display_booth_pramukh_cadre>`;
    
    // Use helper function to get admin endpoint
    const adminEndpoint = getAdminEndpoint(panelApiUrl);
    
    return this.makeRequest(
      adminEndpoint,
      'POST', 
      'display_booth_pramukh_cadre',
      soapBody,
      true // Use admin authentication
    );
  },

  // Display Booth Pramukh Wise Voter function
  displayBoothPramukhWiseVoter: async function(boothNo, panelApiUrl) {
    const soapBody = `<dis_booth_pramukh_wise_voter xmlns="http://tempuri.org/">
      <booth_no>${boothNo}</booth_no>
    </dis_booth_pramukh_wise_voter>`;
    
    // Use helper function to get admin endpoint
    const adminEndpoint = getAdminEndpoint(panelApiUrl);
    
    return this.makeRequest(
      adminEndpoint,
      'POST', 
      'dis_booth_pramukh_wise_voter',
      soapBody,
      true // Use admin authentication
    );
  },

  // Display All Address function
  displayAllAddress: async function(panelApiUrl) {
    const soapBody = `<dis_all_address xmlns="http://tempuri.org/" />`;
    
    // Use helper function to get admin endpoint
    const adminEndpoint = getAdminEndpoint(panelApiUrl);
    
    return this.makeRequest(
      adminEndpoint,
      'POST', 
      'dis_all_address',
      soapBody,
      true // Use admin authentication
    );
  },

  // Address Wise Search function
  addressWiseSearch: async function(address, panelApiUrl) {
    const soapBody = `<address_wise_search xmlns="http://tempuri.org/">
      <add>${address}</add>
    </address_wise_search>`;
    
    // Use helper function to get admin endpoint
    const adminEndpoint = getAdminEndpoint(panelApiUrl);
    
    return this.makeRequest(
      adminEndpoint,
      'POST', 
      'address_wise_search',
      soapBody,
      true // Use admin authentication
    );
  },

  // Display All Polling Location function
  displayAllPollingLocation: async function(panelApiUrl) {
    const soapBody = `<dis_all_polling_location xmlns="http://tempuri.org/" />`;
    
    // Use helper function to get admin endpoint
    const adminEndpoint = getAdminEndpoint(panelApiUrl);
    
    return this.makeRequest(
      adminEndpoint,
      'POST', 
      'dis_all_polling_location',
      soapBody,
      true // Use admin authentication
    );
  },

  // Display Polling Location Wise Voter function
  displayPollingLocationWiseVoter: async function(pollingLocation, panelApiUrl) {
    const soapBody = `<display_polling_location_wise_voter xmlns="http://tempuri.org/">
      <polling_location>${pollingLocation}</polling_location>
    </display_polling_location_wise_voter>`;
    
    // Use helper function to get admin endpoint
    const adminEndpoint = getAdminEndpoint(panelApiUrl);
    
    return this.makeRequest(
      adminEndpoint,
      'POST', 
      'display_polling_location_wise_voter',
      soapBody,
      true // Use admin authentication
    );
  },

  // Display All Surname function
  displayAllSurname: async function(panelApiUrl) {
    const soapBody = `<dis_all_surname xmlns="http://tempuri.org/" />`;
    
    // Use helper function to get admin endpoint
    const adminEndpoint = getAdminEndpoint(panelApiUrl);
    
    return this.makeRequest(
      adminEndpoint,
      'POST', 
      'dis_all_surname',
      soapBody,
      true // Use admin authentication
    );
  },

  // Surname Wise Search function
  surnameWiseSearch: async function(surnameList, panelApiUrl) {
    const soapBody = `<surname_wise_search xmlns="http://tempuri.org/">
      <surname_list>${surnameList}</surname_list>
    </surname_wise_search>`;
    
    // Use helper function to get admin endpoint
    const adminEndpoint = getAdminEndpoint(panelApiUrl);
    
    return this.makeRequest(
      adminEndpoint,
      'POST', 
      'surname_wise_search',
      soapBody,
      true // Use admin authentication
    );
  },

  // Age Wise Search function
  ageWiseSearch: async function(fromAge, toAge, panelApiUrl) {
    const soapBody = `<age_wise_search xmlns="http://tempuri.org/">
      <from_age>${fromAge}</from_age>
      <to_age>${toAge}</to_age>
    </age_wise_search>`;
    
    // Use helper function to get admin endpoint
    const adminEndpoint = getAdminEndpoint(panelApiUrl);
    
    return this.makeRequest(
      adminEndpoint,
      'POST', 
      'age_wise_search',
      soapBody,
      true // Use admin authentication
    );
  },

  // Get Designations function
  getDesignations: async function(type, panelApiUrl) {
    const soapBody = `<dis_designation xmlns="http://tempuri.org/">
      <type>${type}</type>
    </dis_designation>`;
    
    // Use helper function to get admin endpoint
    const adminEndpoint = getAdminEndpoint(panelApiUrl);
    
    return this.makeRequest(
      adminEndpoint,
      'POST', 
      'dis_designation',
      soapBody,
      true // Use admin authentication
    );
  }
};

// Fetch all booths for Shakti allocation (SP)
export const displayAllBoothForSaktiAllocation = async function(type = 'SP', panelApiUrl) {
  const soapBody = `<display_all_booth_for_sakti_allocation xmlns="http://tempuri.org/">
    <type>${type}</type>
  </display_all_booth_for_sakti_allocation>`;

  // Use helper function to get admin endpoint
  const adminEndpoint = getAdminEndpoint(panelApiUrl);

  return apiService.makeRequest(
    adminEndpoint,
    'POST',
    'display_all_booth_for_sakti_allocation',
    soapBody,
    true
  );
};

// Building Pramukh (Building Heads) - new function
export const displayBuildingPramukh = async function(panelApiUrl) {
  const soapBody = `<dis_building_pramukh xmlns="http://tempuri.org/" />`;

  // Use helper function to get admin endpoint
  const adminEndpoint = getAdminEndpoint(panelApiUrl);

  return apiService.makeRequest(
    adminEndpoint,
    'POST',
    'dis_building_pramukh',
    soapBody,
    true // use admin auth header
  );
};

// Building Pramukh Cadre with Voter data - new function
export const displayBuildingPramukhCadreWithVoter = async function(mainAdminId, panelApiUrl) {
  const soapBody = `<dis_building_pramukh_cadre_with_voter xmlns="http://tempuri.org/">
    <main_admin_id>${mainAdminId}</main_admin_id>
  </dis_building_pramukh_cadre_with_voter>`;

  // Use helper function to get admin endpoint
  const adminEndpoint = getAdminEndpoint(panelApiUrl);

  return apiService.makeRequest(
    adminEndpoint,
    'POST',
    'dis_building_pramukh_cadre_with_voter',
    soapBody,
    true // use admin auth header
  );
};

// Type wise user list from survey - new function
export const displayTypeWiseUserListFromSurvey = async function(surveyByType = 'sp', surveyFrom = '', panelApiUrl) {
  const soapBody = `<dis_type_wise_user_list_from_survey xmlns="http://tempuri.org/">
    <survey_by_type>${surveyByType}</survey_by_type>
    <survey_from>${surveyFrom}</survey_from>
  </dis_type_wise_user_list_from_survey>`;

  // Use helper function to get admin endpoint
  const adminEndpoint = getAdminEndpoint(panelApiUrl);

  return apiService.makeRequest(
    adminEndpoint,
    'POST',
    'dis_type_wise_user_list_from_survey',
    soapBody,
    true // use admin auth header
  );
};

// No survey user by type - new function
export const noSurveyUserByType = async function(type = 'BP', panelApiUrl) {
  const soapBody = `<no_survey_user_by_type xmlns="http://tempuri.org/">
    <type>${type}</type>
  </no_survey_user_by_type>`;

  // Use helper function to get admin endpoint
  const adminEndpoint = getAdminEndpoint(panelApiUrl);

  return apiService.makeRequest(
    adminEndpoint,
    'POST',
    'no_survey_user_by_type',
    soapBody,
    true // use admin auth header
  );
};

// Education wise survey dashboard - new function
export const displayEducationWiseSurveyDash = async function(panelApiUrl) {
  const soapBody = `<dis_education_wise_survey_dash xmlns="http://tempuri.org/" />`;

  // Use helper function to get admin endpoint
  const adminEndpoint = getAdminEndpoint(panelApiUrl);

  return apiService.makeRequest(
    adminEndpoint,
    'POST',
    'dis_education_wise_survey_dash',
    soapBody,
    true // use admin auth header
  );
};

// Education wise survey voter - fetch voters by category id
export const displayEducationWiseSurveyVoter = async function(id, panelApiUrl) {
  const soapBody = `<dis_education_wise_survey_voter xmlns="http://tempuri.org/">
    <id>${id}</id>
  </dis_education_wise_survey_voter>`;

  // Use helper function to get admin endpoint
  const adminEndpoint = getAdminEndpoint(panelApiUrl);

  return apiService.makeRequest(
    adminEndpoint,
    'POST',
    'dis_education_wise_survey_voter',
    soapBody,
    true // use admin auth header
  );
};

// Caste wise survey dashboard - new function
export const displayCasteWiseSurveyDash = async function(panelApiUrl) {
  const soapBody = `<dis_cast_wise_survey_dash xmlns="http://tempuri.org/" />`;

  // Use helper function to get admin endpoint
  const adminEndpoint = getAdminEndpoint(panelApiUrl);

  return apiService.makeRequest(
    adminEndpoint,
    'POST',
    'dis_cast_wise_survey_dash',
    soapBody,
    true // use admin auth header
  );
};

// Caste wise survey voter - fetch voters by caste id
export const displayCasteWiseSurveyVoter = async function(id, panelApiUrl) {
  const soapBody = `<dis_cast_wise_survey_voter xmlns="http://tempuri.org/">
    <id>${id}</id>
  </dis_cast_wise_survey_voter>`;

  // Use helper function to get admin endpoint
  const adminEndpoint = getAdminEndpoint(panelApiUrl);

  return apiService.makeRequest(
    adminEndpoint,
    'POST',
    'dis_cast_wise_survey_voter',
    soapBody,
    true // use admin auth header
  );
};

// Community wise survey dashboard - new function
export const displayCommunityWiseSurveyDash = async function(panelApiUrl) {
  const soapBody = `<dis_community_wise_survey_dash xmlns="http://tempuri.org/" />`;

  // Use helper function to get admin endpoint
  const adminEndpoint = getAdminEndpoint(panelApiUrl);

  return apiService.makeRequest(
    adminEndpoint,
    'POST',
    'dis_community_wise_survey_dash',
    soapBody,
    true // use admin auth header
  );
};

// Community wise survey voter - fetch voters by community id (note: API has typo "commuinity")
export const displayCommunityWiseSurveyVoter = async function(id, panelApiUrl) {
  const soapBody = `<dis_commuinity_wise_survey_voter xmlns="http://tempuri.org/">
    <id>${id}</id>
  </dis_commuinity_wise_survey_voter>`;

  // Use helper function to get admin endpoint
  const adminEndpoint = getAdminEndpoint(panelApiUrl);

  return apiService.makeRequest(
    adminEndpoint,
    'POST',
    'dis_commuinity_wise_survey_voter',
    soapBody,
    true // use admin auth header
  );
};

// Ration card wise survey dashboard - new function
export const displayRationCardWiseSurveyDash = async function(panelApiUrl) {
  const soapBody = `<dis_ration_card_wise_survey_dash xmlns="http://tempuri.org/" />`;

  // Use helper function to get admin endpoint
  const adminEndpoint = getAdminEndpoint(panelApiUrl);

  return apiService.makeRequest(
    adminEndpoint,
    'POST',
    'dis_ration_card_wise_survey_dash',
    soapBody,
    true // use admin auth header
  );
};

// Ration card wise survey voter - fetch voters by ration card id/name
export const displayRationCardWiseSurveyVoter = async function(id, panelApiUrl) {
  const soapBody = `<dis_ration_card_wise_survey_voter xmlns="http://tempuri.org/">
    <id>${id}</id>
  </dis_ration_card_wise_survey_voter>`;

  // Use helper function to get admin endpoint
  const adminEndpoint = getAdminEndpoint(panelApiUrl);

  return apiService.makeRequest(
    adminEndpoint,
    'POST',
    'dis_ration_card_wise_survey_voter',
    soapBody,
    true // use admin auth header
  );
};

// Phonebook match admin list - new function
export const displayAllPhonebookMatchAdmin = async function(panelApiUrl) {
  const soapBody = `<display_all_phonebook_match_admin xmlns="http://tempuri.org/" />`;

  const adminEndpoint = getAdminEndpoint(panelApiUrl);

  return apiService.makeRequest(
    adminEndpoint,
    'POST',
    'display_all_phonebook_match_admin',
    soapBody,
    true
  );
};

// Phonebook member list for admin
export const displayPhonebookMember = async function(adminId, panelApiUrl) {
  // Ensure adminId is a valid number
  const numericAdminId = Number(adminId)
  if (isNaN(numericAdminId) || numericAdminId <= 0) {
    throw new Error(`Invalid admin_id: ${adminId}. Must be a positive number.`)
  }

  const soapBody = `<display_phonebook_member xmlns="http://tempuri.org/">
    <user_id>${numericAdminId}</user_id>
  </display_phonebook_member>`;

  console.log('displayPhonebookMember SOAP body:', soapBody)

  const adminEndpoint = getAdminEndpoint(panelApiUrl);

  return apiService.makeRequest(
    adminEndpoint,
    'POST',
    'display_phonebook_member',
    soapBody,
    true
  );
};

// Scheme wise survey dashboard - new function
export const displaySchemeWiseSurveyDash = async function(panelApiUrl) {
  const soapBody = `<dis_scheme_wise_survey_dash xmlns="http://tempuri.org/" />`;

  // Use helper function to get admin endpoint
  const adminEndpoint = getAdminEndpoint(panelApiUrl);

  return apiService.makeRequest(
    adminEndpoint,
    'POST',
    'dis_scheme_wise_survey_dash',
    soapBody,
    true // use admin auth header
  );
};

// Scheme wise survey voter - fetch voters by scheme id
export const displaySchemeWiseSurveyVoter = async function(id, panelApiUrl) {
  const soapBody = `<dis_scheme_wise_survey_voter xmlns="http://tempuri.org/">
    <id>${id}</id>
  </dis_scheme_wise_survey_voter>`;

  // Use helper function to get admin endpoint
  const adminEndpoint = getAdminEndpoint(panelApiUrl);

  return apiService.makeRequest(
    adminEndpoint,
    'POST',
    'dis_scheme_wise_survey_voter',
    soapBody,
    true // use admin auth header
  );
};

// Booth wise survey dashboard - new function
export const displayBoothWiseSurveyDash = async function(panelApiUrl) {
  const soapBody = `<dis_booth_wise_survey_dash xmlns="http://tempuri.org/" />`;

  // Use helper function to get admin endpoint
  const adminEndpoint = getAdminEndpoint(panelApiUrl);

  return apiService.makeRequest(
    adminEndpoint,
    'POST',
    'dis_booth_wise_survey_dash',
    soapBody,
    true // use admin auth header
  );
};

// Booth wise survey voter - new function
export const displayBoothWiseSurveyVoter = async function(id, panelApiUrl) {
  const soapBody = `<dis_booth_wise_survey_voter xmlns="http://tempuri.org/">
    <id>${id}</id>
  </dis_booth_wise_survey_voter>`;

  // Use helper function to get admin endpoint
  const adminEndpoint = getAdminEndpoint(panelApiUrl);

  return apiService.makeRequest(
    adminEndpoint,
    'POST',
    'dis_booth_wise_survey_voter',
    soapBody,
    true // use admin auth header
  );
};

// Standalone function for displayBoothWiseVoter to avoid context issues
export const displayBoothWiseVoter = async function(boothNo, panelApiUrl) {
  const soapBody = `<display_booth_wise_voter xmlns="http://tempuri.org/">
    <booth_no>${boothNo}</booth_no>
  </display_booth_wise_voter>`;
  
  // Use helper function to get admin endpoint
  const adminEndpoint = getAdminEndpoint(panelApiUrl);
  
  return apiService.makeRequest(
    adminEndpoint,
    'POST', 
    'display_booth_wise_voter',
    soapBody,
    true // Use admin authentication
  );
};

// Date wise survey dashboard - fetch survey data by month
export const displayDateWiseSurveyDash = async function(month, panelApiUrl) {
  const soapBody = `<dis_date_wise_survey_dash xmlns="http://tempuri.org/">
    <month>${month}</month>
  </dis_date_wise_survey_dash>`;

  // Use helper function to get admin endpoint
  const adminEndpoint = getAdminEndpoint(panelApiUrl);

  return apiService.makeRequest(
    adminEndpoint,
    'POST',
    'dis_date_wise_survey_dash',
    soapBody,
    true // use admin auth header
  );
};

// Date wise survey voter - fetch voters by date
export const displayDateWiseSurveyVoter = async function(date, panelApiUrl) {
  const soapBody = `<dis_date_wise_survey_voter xmlns="http://tempuri.org/">
    <date>${date}</date>
  </dis_date_wise_survey_voter>`;

  // Use helper function to get admin endpoint
  const adminEndpoint = getAdminEndpoint(panelApiUrl);

  return apiService.makeRequest(
    adminEndpoint,
    'POST',
    'dis_date_wise_survey_voter',
    soapBody,
    true // use admin auth header
  );
};

// Display user wise survey voter
export const displayUserWiseSurveyVoter = async function(adminId, surveyFrom = '', panelApiUrl) {
  const soapBody = `<dis_user_wise_survey_voter xmlns="http://tempuri.org/">
    <admin_id>${adminId}</admin_id>
    <survey_from>${surveyFrom}</survey_from>
  </dis_user_wise_survey_voter>`;

  // Use helper function to get admin endpoint
  // If panelApiUrl is not provided, use the fixed endpoint for this API
  const adminEndpoint = panelApiUrl 
    ? getAdminEndpoint(panelApiUrl)
    : (import.meta.env.DEV ? '/panel-api/webservice.asmx' : 'http://ntmc2.mhbjplok.com/webservice.asmx');

  return apiService.makeRequest(
    adminEndpoint,
    'POST',
    'dis_user_wise_survey_voter',
    soapBody,
    true // use admin auth header
  );
};

// Display voter survey log using voter id (idcard_no)
export const displayVoterSurveyLog = async function(voterId, panelApiUrl) {
  const soapBody = `<display_voter_survey_log xmlns="http://tempuri.org/">
    <voter_id>${voterId}</voter_id>
  </display_voter_survey_log>`;

  const adminEndpoint = getAdminEndpoint(panelApiUrl);

  return apiService.makeRequest(
    adminEndpoint,
    'POST',
    'display_voter_survey_log',
    soapBody,
    true
  );
};

// Select survey detail by survey id
export const selectSurveyDetail = async function(surveyId, panelApiUrl) {
  const soapBody = `<sel_survey_detail xmlns="http://tempuri.org/">
    <survey_id>${surveyId}</survey_id>
  </sel_survey_detail>`;

  const adminEndpoint = getAdminEndpoint(panelApiUrl);

  return apiService.makeRequest(
    adminEndpoint,
    'POST',
    'sel_survey_detail',
    soapBody,
    true
  );
};

// Redevelopment building - fetch redevelopment building addresses
export const displayRedevelopmentBuilding = async function(panelApiUrl) {
  const soapBody = `<dis_redevelopment_building xmlns="http://tempuri.org/" />`;

  // Use helper function to get admin endpoint
  const adminEndpoint = getAdminEndpoint(panelApiUrl);

  return apiService.makeRequest(
    adminEndpoint,
    'POST',
    'dis_redevelopment_building',
    soapBody,
    true // use admin auth header
  );
};

// Death survey - fetch death survey voters
export const displayDeathSurvey = async function(panelApiUrl) {
  const soapBody = `<dis_death_voter xmlns="http://tempuri.org/" />`;

  // Use helper function to get admin endpoint
  const adminEndpoint = getAdminEndpoint(panelApiUrl);

  return apiService.makeRequest(
    adminEndpoint,
    'POST',
    'dis_death_voter',
    soapBody,
    true // use admin auth header
  );
};

// Shifted out voter (Transferred survey) - fetch transferred voters
export const displayShiftedOutVoter = async function(panelApiUrl) {
  const soapBody = `<dis_shifted_out_voter xmlns="http://tempuri.org/" />`;

  // Use helper function to get admin endpoint
  const adminEndpoint = getAdminEndpoint(panelApiUrl);

  return apiService.makeRequest(
    adminEndpoint,
    'POST',
    'dis_shifted_out_voter',
    soapBody,
    true // use admin auth header
  );
};

// Utility function to get house number from voter data
export const getHouseNumber = (voterData) => {
  return apiService.extractHouseNumber(voterData);
};

// Utility function to get all house numbers from voter list
export const getAllHouseNumbers = (voterList) => {
  return voterList.map(voter => ({
    id: voter.id,
    name: voter.name,
    eng_house_no: voter.eng_house_no || apiService.extractHouseNumber(voter),
    houseNumber: voter.houseNumber || voter.eng_house_no || apiService.extractHouseNumber(voter)
  }));
};

// Export individual functions for convenience
export const {
  displayAllCopyPer,
  displayAllCorporation,
  displayCorporationWisePanel,
  selectCopy,
  selectCopyPer,
  adminLogin,
  displayAdmin,
  displaySubAdmin,
  displayVolunteer,
  displayShaktiKendraPramukh,
  displayCallCenter,
  displayBoothPramukh,
  displayAllBoothWithAllTotal,
  displaySaktiPramukhCadre,
  displayBoothPramukhBySaktiPramukh,
  displayBoothPramukhCadre,
  displayBoothPramukhWiseVoter,
  displayAllAddress,
  addressWiseSearch,
  displayAllPollingLocation,
  displayPollingLocationWiseVoter,
  displayAllSurname,
  surnameWiseSearch,
  ageWiseSearch,
  getDesignations
} = apiService;

// Default export
export default apiService;


