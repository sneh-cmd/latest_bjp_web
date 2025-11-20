import React from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation, useParams, useSearchParams } from 'react-router-dom'
import BJPSplashScreen from './components/BJPSplashScreen'
import CorporationSelectionSlide from './components/CorporationSelectionSlide'
import PanelSelectionSlide from './components/PanelSelectionSlide'
import LoginSlide from './components/LoginSlide'
import AdminDashboard from './components/admindasbord/dashboard/AdminDashboard'
import AdminList from './components/admindasbord/lists/AdminList'
import AllUsersList from './components/admindasbord/lists/AllUsersList'
import SubAdmin from './components/admindasbord/lists/SubAdmin'
import ShaktiKendraPramukh from './components/admindasbord/lists/ShaktiKendraPramukh'
import Karyakarta from './components/admindasbord/lists/Karyakarta'
import BoothPramukh from './components/admindasbord/lists/BoothPramukh'
import BuildingPramukh from './components/admindasbord/lists/BuildingPramukh'
import BoothDetailSlide from './components/admindasbord/lists/BoothDetailSlide'
import BuildingDetailSlide from './components/admindasbord/lists/BuildingDetailSlide'
import PollingStationSlide from './components/admindasbord/dashboard/PollingStationSlide'
import PollingStationVoterSlide from './components/admindasbord/dashboard/PollingStationVoterSlide'
import SurnameSlide from './components/admindasbord/dashboard/SurnameSlide'
import SurnameVoterSlide from './components/admindasbord/dashboard/SurnameVoterSlide'
import MasterSearchResults from './components/admindasbord/dashboard/MasterSearchResults'
import AgeSlide from './components/admindasbord/dashboard/AgeSlide'
import CallSurveyUser from './components/admindasbord/lists/CallSurveyUser'
import BoothList from './components/admindasbord/dashboard/BoothList'
import VoterList from './components/admindasbord/dashboard/VoterList'
import CadreSurveyReport from './components/admindasbord/dashboard/report/CadreSurveyReport'
import BuildingHeadSurvey from './components/admindasbord/dashboard/report/BuildingHeadSurvey'
import BuildingHeadDetailSlide from './components/admindasbord/dashboard/report/BuildingHeadDetailSlide'
import ShaktiKendraSurvey from './components/admindasbord/dashboard/report/ShaktiKendraSurvey'
import ShaktiDetailSlide from './components/admindasbord/dashboard/report/ShaktiDetailSlide'
import BoothPramukhSurvey from './components/admindasbord/dashboard/report/BoothPramukhSurvey'
import BoothPramukhDetailSlide from './components/admindasbord/dashboard/report/BoothPramukhDetailSlide'
import PhonebookSurvey from './components/admindasbord/dashboard/report/PhonebookSurvey'
import PhonebookDetailSlide from './components/admindasbord/dashboard/report/PhonebookDetailSlide'
import VoterLogDetailSlide from './components/admindasbord/dashboard/report/VoterLogDetailSlide'
import BoothWiseSurvey from './components/admindasbord/dashboard/report/BoothWiseSurvey'
import DateWiseSurvey from './components/admindasbord/dashboard/report/DateWiseSurvey'
import DateDetailSlide from './components/admindasbord/dashboard/report/DateDetailSlide'
import SchemeWiseSurvey from './components/admindasbord/dashboard/report/SchemeWiseSurvey'
import SchemeDetailSlide from './components/admindasbord/dashboard/report/SchemeDetailSlide'
import RationCardWiseSurvey from './components/admindasbord/dashboard/report/RationCardWiseSurvey'
import RationCardDetailSlide from './components/admindasbord/dashboard/report/RationCardDetailSlide'
import CommunityWiseSurvey from './components/admindasbord/dashboard/report/CommunityWiseSurvey'
import CommunityDetailSlide from './components/admindasbord/dashboard/report/CommunityDetailSlide'
import CasteWiseSurvey from './components/admindasbord/dashboard/report/CasteWiseSurvey'
import CasteDetailSlide from './components/admindasbord/dashboard/report/CasteDetailSlide'
import EducationProfessionWiseSurvey from './components/admindasbord/dashboard/report/EducationProfessionWiseSurvey'
import EducationProfessionDetailSlide from './components/admindasbord/dashboard/report/EducationProfessionDetailSlide'
import RedevelopmentBuilding from './components/admindasbord/dashboard/report/RedevelopmentBuilding'
import DeathSurvey from './components/admindasbord/dashboard/report/DeathSurvey'
import TransferredSurvey from './components/admindasbord/dashboard/report/TransferredSurvey'
import KaryakartaPhonebook from './components/admindasbord/third_list/KaryakartaPhonebook'
import KaryakartaPhonebookMembers from './components/admindasbord/third_list/PhonebookMemberList'
import MatchRemaining from './components/admindasbord/third_list/MatchRemaining'
import BoothWisePhonebook from './components/admindasbord/third_list/BoothWisePhonebook'
import BoothWisePhonebookMember from './components/admindasbord/third_list/BoothWisePhonebookMember'
import SurnameGroupPhonebook from './components/admindasbord/third_list/SurnameGroupPhonebook'
import SurnameGroupMemberList from './components/admindasbord/third_list/SurnameGroupMemberList'
import BoothSurveyDetailSlide from './components/admindasbord/dashboard/report/BoothDetailSlide'
import Familyscreen from './components/admindasbord/dashboard/Familyscreen'
import AddressDetailSlide from './components/admindasbord/dashboard/AddressDetailSlide'
import AddressVoterSlide from './components/admindasbord/dashboard/AddressVoterSlide'
import './App.css'

function NavigationProvider({ children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const params = useParams()
  const [searchParams] = useSearchParams()
  
  // Convert search params to object
  const queryParams = Object.fromEntries(searchParams.entries())
  
  // Merge path params and query params
  const mergedParams = { ...params, ...queryParams }
  
  // Get state from location.state
  const state = location.state
  
  console.log("Booth Data: ", state?.boothData)
  console.log("Location: ", location)
  console.log("Params: ", mergedParams)
  
  const navigationContext = {
    navigate: (path, navigationState = null) => {
      console.log("Navigation State: ", navigationState)
      console.log("All Params: ", mergedParams)
      navigate(path, { state: navigationState })
    },
    params: mergedParams,
    state
  }

  // Check if children is a function (render prop pattern)
  if (typeof children === 'function') {
    return children(navigationContext)
  }

  return React.cloneElement(children, { navigation: navigationContext })
}

// Wrapper components for routes that need navigation context
function SplashScreenWrapper() {
  return (
    <NavigationProvider>
      <BJPSplashScreen />
    </NavigationProvider>
  )
}

function CorporationWrapper() {
  return (
    <NavigationProvider>
      <CorporationSelectionSlide />
    </NavigationProvider>
  )
}

function PanelWrapper() {
  return (
    <NavigationProvider>
      <PanelSelectionSlide />
    </NavigationProvider>
  )
}

function LoginWrapper() {
  return (
    <NavigationProvider>
      <LoginSlide />
    </NavigationProvider>
  )
}

function AdminDashboardWrapper() {
  return (
    <NavigationProvider>
      <AdminDashboard />
    </NavigationProvider>
  )
}

function AdminListWrapper() {
  return (
    <NavigationProvider>
      <AdminList />
    </NavigationProvider>
  )
}

function AllUsersListWrapper() {
  return (
    <NavigationProvider>
      <AllUsersList />
    </NavigationProvider>
  )
}

function SubAdminWrapper() {
  return (
    <NavigationProvider>
      <SubAdmin />
    </NavigationProvider>
  )
}

function ShaktiKendraPramukhWrapper() {
  return (
    <NavigationProvider>
      <ShaktiKendraPramukh />
    </NavigationProvider>
  )
}

function KaryakartaWrapper() {
  return (
    <NavigationProvider>
      <Karyakarta />
    </NavigationProvider>
  )
}

function BoothPramukhWrapper() {
  return (
    <NavigationProvider>
      <BoothPramukh />
    </NavigationProvider>
  )
}

function KaryakartaPhonebookMembersWrapper() {
  return (
    <NavigationProvider>
      <KaryakartaPhonebookMembers />
    </NavigationProvider>
  )
}

function FamilyscreenWrapper() {
  return (
    <NavigationProvider>
      <Familyscreen />
    </NavigationProvider>
  )
}

function AddressDetailSlideWrapper() {
  return (
    <NavigationProvider>
      <AddressDetailSlide />
    </NavigationProvider>
  )
}

function AddressVoterSlideWrapper() {
  return (
    <NavigationProvider>
      <AddressVoterSlide />
    </NavigationProvider>
  )
}

function PollingStationSlideWrapper() {
  return (
    <NavigationProvider>
      <PollingStationSlide />
    </NavigationProvider>
  )
}

function PollingStationVoterSlideWrapper() {
  return (
    <NavigationProvider>
      <PollingStationVoterSlide />
    </NavigationProvider>
  )
}

function SurnameSlideWrapper() {
  return (
    <NavigationProvider>
      <SurnameSlide />
    </NavigationProvider>
  )
}

function SurnameVoterSlideWrapper() {
  return (
    <NavigationProvider>
      <SurnameVoterSlide />
    </NavigationProvider>
  )
}

function MasterSearchResultsWrapper() {
  return (
    <NavigationProvider>
      <MasterSearchResults />
    </NavigationProvider>
  )
}

function AgeSlideWrapper() {
  return (
    <NavigationProvider>
      <AgeSlide />
    </NavigationProvider>
  )
}

function BuildingPramukhWrapper() {
  return (
    <NavigationProvider>
      <BuildingPramukh />
    </NavigationProvider>
  )
}

function BoothDetailWrapper() {
  return (
    <NavigationProvider>
      {(navigation) => (
        <BoothDetailSlide 
          navigation={navigation}
          boothData={navigation.state?.boothData}
          boothId={navigation.params?.boothId}
        />
      )}
    </NavigationProvider>
  )
}

function BuildingDetailWrapper() {
  return (
    <NavigationProvider>
      {(navigation) => (
        <BuildingDetailSlide
          navigation={navigation}
          buildingData={navigation.state?.buildingData}
          buildingId={navigation.params?.buildingId}
        />
      )}
    </NavigationProvider>
  )
}

function CallSurveyUserWrapper() {
  return (
    <NavigationProvider>
      <CallSurveyUser />
    </NavigationProvider>
  )
}

function BoothListWrapper() {
  return (
    <NavigationProvider>
      <BoothList />
    </NavigationProvider>
  )
}

function VoterListWrapper() {
  return (
    <NavigationProvider>
      <VoterList />
    </NavigationProvider>
  )
}

function CadreSurveyReportWrapper() {
  return (
    <NavigationProvider>
      <CadreSurveyReport />
    </NavigationProvider>
  )
}

function BuildingHeadSurveyWrapper() {
  return (
    <NavigationProvider>
      <BuildingHeadSurvey />
    </NavigationProvider>
  )
}

function BuildingHeadDetailSlideWrapper() {
  return (
    <NavigationProvider>
      <BuildingHeadDetailSlide />
    </NavigationProvider>
  )
}

function ShaktiDetailSlideWrapper() {
  return (
    <NavigationProvider>
      <ShaktiDetailSlide />
    </NavigationProvider>
  )
}

function ShaktiKendraSurveyWrapper() {
  return (
    <NavigationProvider>
      <ShaktiKendraSurvey />
    </NavigationProvider>
  )
}

function BoothPramukhSurveyWrapper() {
  return (
    <NavigationProvider>
      <BoothPramukhSurvey />
    </NavigationProvider>
  )
}

function BoothPramukhDetailSlideWrapper() {
  return (
    <NavigationProvider>
      <BoothPramukhDetailSlide />
    </NavigationProvider>
  )
}

function PhonebookSurveyWrapper() {
  return (
    <NavigationProvider>
      <PhonebookSurvey />
    </NavigationProvider>
  )
}

function PhonebookDetailSlideWrapper() {
  return (
    <NavigationProvider>
      <PhonebookDetailSlide />
    </NavigationProvider>
  )
}

function VoterLogDetailSlideWrapper() {
  return (
    <NavigationProvider>
      <VoterLogDetailSlide />
    </NavigationProvider>
  )
}

function BoothWiseSurveyWrapper() {
  return (
    <NavigationProvider>
      <BoothWiseSurvey />
    </NavigationProvider>
  )
}

function DateWiseSurveyWrapper() {
  return (
    <NavigationProvider>
      <DateWiseSurvey />
    </NavigationProvider>
  )
}

function SchemeWiseSurveyWrapper() {
  return (
    <NavigationProvider>
      <SchemeWiseSurvey />
    </NavigationProvider>
  )
}

function RationCardWiseSurveyWrapper() {
  return (
    <NavigationProvider>
      <RationCardWiseSurvey />
    </NavigationProvider>
  )
}

function CommunityWiseSurveyWrapper() {
  return (
    <NavigationProvider>
      <CommunityWiseSurvey />
    </NavigationProvider>
  )
}

function CasteWiseSurveyWrapper() {
  return (
    <NavigationProvider>
      <CasteWiseSurvey />
    </NavigationProvider>
  )
}

function EducationProfessionWiseSurveyWrapper() {
  return (
    <NavigationProvider>
      <EducationProfessionWiseSurvey />
    </NavigationProvider>
  )
}

function EducationProfessionDetailSlideWrapper() {
  return (
    <NavigationProvider>
      <EducationProfessionDetailSlide />
    </NavigationProvider>
  )
}

function RedevelopmentBuildingWrapper() {
  return (
    <NavigationProvider>
      <RedevelopmentBuilding />
    </NavigationProvider>
  )
}

function DeathSurveyWrapper() {
  return (
    <NavigationProvider>
      <DeathSurvey />
    </NavigationProvider>
  )
}

function TransferredSurveyWrapper() {
  return (
    <NavigationProvider>
      <TransferredSurvey />
    </NavigationProvider>
  )
}

function KaryakartaPhonebookWrapper() {
  return (
    <NavigationProvider>
      <KaryakartaPhonebook />
    </NavigationProvider>
  )
}

function MatchRemainingWrapper() {
  return (
    <NavigationProvider>
      <MatchRemaining />
    </NavigationProvider>
  )
}

function BoothWisePhonebookWrapper() {
  return (
    <NavigationProvider>
      <BoothWisePhonebook />
    </NavigationProvider>
  )
}

function BoothWisePhonebookMemberWrapper() {
  return (
    <NavigationProvider>
      <BoothWisePhonebookMember />
    </NavigationProvider>
  )
}

function SurnameGroupPhonebookWrapper() {
  return (
    <NavigationProvider>
      <SurnameGroupPhonebook />
    </NavigationProvider>
  )
}

function SurnameGroupMemberListWrapper() {
  return (
    <NavigationProvider>
      <SurnameGroupMemberList />
    </NavigationProvider>
  )
}

function CasteDetailSlideWrapper() {
  return (
    <NavigationProvider>
      <CasteDetailSlide />
    </NavigationProvider>
  )
}

function CommunityDetailSlideWrapper() {
  return (
    <NavigationProvider>
      <CommunityDetailSlide />
    </NavigationProvider>
  )
}

function RationCardDetailSlideWrapper() {
  return (
    <NavigationProvider>
      <RationCardDetailSlide />
    </NavigationProvider>
  )
}

function SchemeDetailSlideWrapper() {
  return (
    <NavigationProvider>
      <SchemeDetailSlide />
    </NavigationProvider>
  )
}

function BoothSurveyDetailSlideWrapper() {
  return (
    <NavigationProvider>
      <BoothSurveyDetailSlide />
    </NavigationProvider>
  )
}

function DateDetailSlideWrapper() {
  return (
    <NavigationProvider>
      <DateDetailSlide />
    </NavigationProvider>
  )
}

function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        <Routes>
          <Route path="/" element={<SplashScreenWrapper />} />
          <Route path="/corporation" element={<CorporationWrapper />} />
          <Route path="/panel/:corporationId" element={<PanelWrapper />} />
          <Route path="/login/:corporationId/:panelId" element={<LoginWrapper />} />
          <Route path="/admin" element={<AdminDashboardWrapper />} />
          <Route path="/admin-list" element={<AdminListWrapper />} />
          <Route path="/all-users" element={<AllUsersListWrapper />} />
          <Route path="/sub-admin" element={<SubAdminWrapper />} />
          <Route path="/shakti-kendra-pramukh" element={<ShaktiKendraPramukhWrapper />} />
          <Route path="/karyakarta" element={<KaryakartaWrapper />} />
          <Route path="/booth-pramukh" element={<BoothPramukhWrapper />} />
          <Route path="/family-screen" element={<FamilyscreenWrapper />} />
          <Route path="/address-detail" element={<AddressDetailSlideWrapper />} />
          <Route path="/address-voter" element={<AddressVoterSlideWrapper />} />
          <Route path="/polling-station" element={<PollingStationSlideWrapper />} />
          <Route path="/polling-station-voter" element={<PollingStationVoterSlideWrapper />} />
          <Route path="/surname" element={<SurnameSlideWrapper />} />
          <Route path="/surname-voter" element={<SurnameVoterSlideWrapper />} />
          <Route path="/master-search-results" element={<MasterSearchResultsWrapper />} />
          <Route path="/age" element={<AgeSlideWrapper />} />

          <Route path="/building-pramukh" element={<BuildingPramukhWrapper />} />
          <Route path="/building-detail" element={<BuildingDetailWrapper />} />


          <Route path="/booth-detail" element={<BoothDetailWrapper />} />
          <Route path="/call-survey-user" element={<CallSurveyUserWrapper />} />
          <Route path="/booth-list" element={<BoothListWrapper />} />
          <Route path="/voter-list" element={<VoterListWrapper />} />
          <Route path="/cadre-survey-report" element={<CadreSurveyReportWrapper />} />
          <Route path="/building-head-survey" element={<BuildingHeadSurveyWrapper />} />
          <Route path="/building-head-detail-slide" element={<BuildingHeadDetailSlideWrapper />} />
          <Route path="/shakti-kendra-survey" element={<ShaktiKendraSurveyWrapper />} />
          <Route path="/shakti-detail-slide" element={<ShaktiDetailSlideWrapper />} />
          <Route path="/booth-pramukh-survey" element={<BoothPramukhSurveyWrapper />} />
          <Route path="/booth-pramukh-detail-slide" element={<BoothPramukhDetailSlideWrapper />} />
          <Route path="/phonebook-survey" element={<PhonebookSurveyWrapper />} />
          <Route path="/phonebook-detail-slide" element={<PhonebookDetailSlideWrapper />} />
          <Route path="/voter-log" element={<VoterLogDetailSlideWrapper />} />
          <Route path="/booth-wise-survey" element={<BoothWiseSurveyWrapper />} />
          <Route path="/booth-survey-detail" element={<BoothSurveyDetailSlideWrapper />} />
          <Route path="/date-wise-survey" element={<DateWiseSurveyWrapper />} />
          <Route path="/date-detail" element={<DateDetailSlideWrapper />} />
          <Route path="/scheme-wise-survey" element={<SchemeWiseSurveyWrapper />} />
          <Route path="/scheme-detail" element={<SchemeDetailSlideWrapper />} />
          <Route path="/ration-card-wise-survey" element={<RationCardWiseSurveyWrapper />} />
          <Route path="/ration-card-detail" element={<RationCardDetailSlideWrapper />} />
          <Route path="/community-wise-survey" element={<CommunityWiseSurveyWrapper />} />
          <Route path="/community-detail" element={<CommunityDetailSlideWrapper />} />
          <Route path="/caste-wise-survey" element={<CasteWiseSurveyWrapper />} />
          <Route path="/caste-detail" element={<CasteDetailSlideWrapper />} />
          <Route path="/education-profession-wise-survey" element={<EducationProfessionWiseSurveyWrapper />} />
          <Route path="/education-profession-detail" element={<EducationProfessionDetailSlideWrapper />} />
          <Route path="/redevelopment-building" element={<RedevelopmentBuildingWrapper />} />
          <Route path="/death-survey" element={<DeathSurveyWrapper />} />
          <Route path="/transferred-survey" element={<TransferredSurveyWrapper />} />
          <Route path="/karyakarta-phonebook" element={<KaryakartaPhonebookWrapper />} />
          <Route path="/karyakarta-phonebook-members" element={<KaryakartaPhonebookMembersWrapper />} />
          <Route path="/match-remaining" element={<MatchRemainingWrapper />} />
          <Route path="/booth-wise-phonebook" element={<BoothWisePhonebookWrapper />} />
          <Route path="/booth-wise-phonebook-member" element={<BoothWisePhonebookMemberWrapper />} />
          <Route path="/surname-group-phonebook" element={<SurnameGroupPhonebookWrapper />} />
          <Route path="/surname-group-member-list" element={<SurnameGroupMemberListWrapper />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App
